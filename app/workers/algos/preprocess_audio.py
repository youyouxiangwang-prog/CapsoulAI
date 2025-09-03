#!/usr/bin/env python3

# preprocess.py
# Audio preprocessing pipeline: VAD, segment merging, optional time-stretch, and output.
# Input: audio file path (wav/mp3/etc). Output: processed wav file.

import os
import math
import time
import torch
import torchaudio
import numpy as np
from pydub import AudioSegment
from typing import List, Tuple, Optional
from dataclasses import dataclass

# --- Constants and Model ---
VAD_MODEL, utils = torch.hub.load(
    repo_or_dir='snakers4/silero-vad',
    model='silero_vad',
    trust_repo=True
)
(get_speech_timestamps, _, _, _, _) = utils
TARGET_SAMPLE_RATE = 16000
VAD_PADDING_SEC = 0.2

USE_TIME_STRETCH = True
TIME_STRETCH_CHOICES = [1.00, 1.03, 1.05]
MIN_SPEECH_SEGMENT_SEC = 2.0
SNR_DB_THRESHOLD = 5.0
CLIPPING_THRESHOLD = 0.015
OCCUPANCY_SLOW = 0.60
OCCUPANCY_MID = 0.75

@dataclass
class SegmentMapping:
    """
    Mapping between a segment in processed audio and original audio.
    Attributes:
        index: segment index
        orig_start: start time in original audio (seconds)
        orig_end: end time in original audio (seconds)
        proc_start: start time in processed audio (seconds)
        proc_end: end time in processed audio (seconds)
        atempo: time-stretch factor used for this segment
        a: linear mapping slope (orig = a * proc + b)
        b: linear mapping intercept
    """
    index: int
    orig_start: float
    orig_end: float
    proc_start: float
    proc_end: float
    atempo: float
    a: float
    b: float

def load_audio(path: str) -> AudioSegment:
    """
    Load audio file, convert to mono, 16kHz, 16-bit PCM.
    Args:
        path: Path to audio file.
    Returns:
        AudioSegment: normalized audio.
    """
    audio = AudioSegment.from_file(path).set_channels(1).set_frame_rate(TARGET_SAMPLE_RATE).set_sample_width(2)
    return audio

def audiosegment_to_np_array(audio: AudioSegment) -> np.ndarray:
    """
    Convert AudioSegment to float32 numpy array in [-1, 1].
    Args:
        audio: AudioSegment
    Returns:
        np.ndarray: waveform
    """
    arr = np.array(audio.get_array_of_samples(), dtype=np.float32)
    arr /= np.iinfo(np.int16).max
    return arr

def merge_and_pad_segments(
    segments: List[Tuple[float, float]],
    total_duration: float
) -> List[Tuple[float, float]]:
    """
    Pad and merge overlapping/close VAD segments.
    Args:
        segments: list of (start, end) in seconds
        total_duration: total audio duration in seconds
    Returns:
        List of merged (start, end) in seconds
    """
    if not segments:
        return []
    padded = []
    for start, end in segments:
        s2 = max(0.0, start - VAD_PADDING_SEC)
        e2 = min(total_duration, end + VAD_PADDING_SEC)
        padded.append((s2, e2))
    padded.sort()
    merged = []
    cur_start, cur_end = padded[0]
    for start, end in padded[1:]:
        if start <= cur_end:
            cur_end = max(cur_end, end)
        else:
            merged.append((cur_start, cur_end))
            cur_start, cur_end = start, end
    merged.append((cur_start, cur_end))
    return merged

def compute_voiced_occupancy(x: np.ndarray, sr: int = TARGET_SAMPLE_RATE, win: float = 0.025, hop: float = 0.010) -> float:
    """
    Compute voiced occupancy (proxy for speech rate/pauses) using short-time energy.
    Args:
        x: waveform
        sr: sample rate
        win: window size (sec)
        hop: hop size (sec)
    Returns:
        float: ratio of voiced frames
    """
    nwin = int(sr * win)
    nhop = int(sr * hop)
    if len(x) < nwin:
        x = np.pad(x, (0, nwin - len(x)))
    frames = []
    for i in range(0, len(x) - nwin + 1, nhop):
        frame = x[i:i + nwin]
        energy = np.mean(frame ** 2) + 1e-12
        frames.append(energy)
    if not frames:
        return 1.0
    E = np.array(frames)
    threshold = max(np.median(E) * 0.5, 1e-10)
    return float((E > threshold).mean())

def estimate_snr_db(x: np.ndarray) -> Tuple[float, float, float]:
    """
    Estimate SNR (dB) using RMS and 10th percentile as noise floor.
    Args:
        x: waveform
    Returns:
        (snr_db, rms, noise_floor)
    """
    absx = np.abs(x)
    rms = np.sqrt(np.mean(x ** 2) + 1e-12)
    noise = np.percentile(absx, 10) + 1e-12
    snr = 20 * math.log10(max(rms, 1e-8) / noise) if noise > 0 else 60.0
    return snr, rms, noise

def compute_clipping_rate(x: np.ndarray, threshold: float = 0.98) -> float:
    """
    Compute fraction of samples above threshold (clipping rate).
    Args:
        x: waveform
        threshold: abs value threshold
    Returns:
        float: clipping rate
    """
    return float((np.abs(x) >= threshold).mean())

def choose_time_stretch(x: np.ndarray, duration: float) -> float:
    """
    Decide time-stretch factor for a segment based on features.
    Args:
        x: waveform
        duration: segment duration (sec)
    Returns:
        float: time-stretch factor (1.00/1.03/1.05)
    """
    if duration < MIN_SPEECH_SEGMENT_SEC:
        return TIME_STRETCH_CHOICES[0]
    snr_db, _, _ = estimate_snr_db(x)
    clip = compute_clipping_rate(x)
    voiced_occ = compute_voiced_occupancy(x)
    if snr_db < SNR_DB_THRESHOLD or clip > CLIPPING_THRESHOLD:
        return TIME_STRETCH_CHOICES[0]
    if voiced_occ < OCCUPANCY_SLOW:
        return TIME_STRETCH_CHOICES[2]
    elif voiced_occ < OCCUPANCY_MID:
        return TIME_STRETCH_CHOICES[1]
    else:
        return TIME_STRETCH_CHOICES[0]

def time_stretch_segment(segment: AudioSegment, factor: float) -> AudioSegment:
    """
    Apply time-stretch (preserving pitch) to an AudioSegment using torchaudio/sox.
    Args:
        segment: AudioSegment
        factor: time-stretch factor (0.5~2.0)
    Returns:
        AudioSegment: time-stretched segment
    """
    if abs(factor - 1.0) < 1e-6:
        return segment
    assert 0.5 <= factor <= 2.0, "factor must be in [0.5, 2.0]"
    try:
        seg16 = segment.set_sample_width(2)
        sr = seg16.frame_rate
        ch = seg16.channels
        pcm = np.frombuffer(seg16.raw_data, dtype=np.int16)
        frames = pcm.size // ch
        if frames == 0:
            return segment
        pcm = pcm.reshape(-1, ch).T.astype(np.float32) / 32768.0
        wav = torch.from_numpy(pcm)
        effects = [["tempo", f"{factor}"]]
        y, sr_out = torchaudio.sox_effects.apply_effects_tensor(wav, sr, effects)
        y_i16 = (y.clamp(-1, 1) * 32767.0).round().to(torch.int16).cpu().numpy()
        y_interleaved = y_i16.T.reshape(-1)
        return AudioSegment(
            data=y_interleaved.tobytes(),
            sample_width=2,
            frame_rate=int(sr_out),
            channels=y.shape[0],
        )
    except Exception as e:
        print(f"[WARN] Time-stretch failed: {e}")
        return segment


def preprocess_audio(
    input_path: str,
    output_path: Optional[str] = None
):
    """
    Main audio preprocessing pipeline: VAD, segment merge, optional time-stretch, output.
    Also returns a mapping from processed audio time to original audio time.
    Args:
        input_path: path to input audio file
        output_path: path to output wav file
    Returns:
        mapping: list of dicts with processed/original time intervals and time_stretch
    Output:
        Writes processed wav to output_path
    """
    # 1. Load and normalize
    audio = load_audio(input_path)
    total_duration = audio.duration_seconds
    waveform = audiosegment_to_np_array(audio)

    # 2. Voice Activity Detection (VAD)
    t0 = time.time()
    speech_timestamps = get_speech_timestamps(
        waveform, VAD_MODEL, sampling_rate=TARGET_SAMPLE_RATE,
        threshold=0.5, min_speech_duration_ms=600,
        min_silence_duration_ms=200, return_seconds=True
    )
    t1 = time.time()

    # 3. Merge and pad segments
    speech_spans = [(float(d["start"]), float(d["end"])) for d in speech_timestamps]
    speech_spans = merge_and_pad_segments(speech_spans, total_duration)

    # 4. Process and concatenate segments, record mapping
    processed = AudioSegment.silent(duration=0, frame_rate=TARGET_SAMPLE_RATE)
    mapping: List[SegmentMapping] = []
    processed_cursor = 0.0  # seconds in processed audio
    for idx, (orig_start, orig_end) in enumerate(speech_spans):
        segment = audio[int(orig_start * 1000):int(orig_end * 1000)]
        orig_duration = orig_end - orig_start
        if USE_TIME_STRETCH:
            x = audiosegment_to_np_array(segment)
            atempo = choose_time_stretch(x, orig_duration)
            segment_stretched = time_stretch_segment(segment, atempo)
        else:
            atempo = 1.0
            segment_stretched = segment
        processed += segment_stretched

        # build mapping
        proc_duration = segment_stretched.duration_seconds
        proc_start = processed_cursor
        proc_end = processed_cursor + proc_duration
        # Linear mapping: orig = a * proc + b (within this segment)
        if proc_end - proc_start > 1e-6:
            a = (orig_end - orig_start) / (proc_end - proc_start)
            b = orig_start - a * proc_start
        else:
            a = 1.0
            b = orig_start
        mapping.append(SegmentMapping(
            index=idx,
            orig_start=orig_start,
            orig_end=orig_end,
            proc_start=proc_start,
            proc_end=proc_end,
            atempo=atempo,
            a=a,
            b=b
        ))
        processed_cursor = proc_end

    # 5. Save output
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    processed.export(output_path, format="wav")
    processed_duration = processed.duration_seconds
    print(f"Input: {total_duration:.2f}s  →  Output: {processed_duration:.2f}s  "
          f"(Saved {(1 - processed_duration / total_duration) * 100:.1f}% )")
    return mapping

def processed_time_to_original_time(processed_time: float, mapping: List[SegmentMapping]) -> float:
    """
    Map a time in processed audio to the corresponding time in the original audio.
    Args:
        processed_time: time in processed audio (seconds)
        mapping: list of SegmentMapping as output by preprocess_audio
    Returns:
        float: corresponding time in original audio (seconds)
    """
    for m in mapping:
        if m.proc_start <= processed_time < m.proc_end:
            return m.a * processed_time + m.b
    # If not found, return last
    return mapping[-1].orig_end if mapping else processed_time

def remap_segments_to_original_timeline(segments: List[dict], mapping: List[SegmentMapping]) -> List[dict]:
    """
    Remap transcription segments from processed audio timeline to original audio timeline.
    Args:
        segments: list of transcription segments
        mapping: list of SegmentMapping as output by preprocess_audio
    Returns:
        list: remapped transcription segments
    """
    if not mapping:
        return segments
    remapped_segments = segments.copy()
    for seg in remapped_segments:
        # remap segment-level
        for k in ("start", "end"):
            v = seg.get(k)
            if v is not None:
                seg[k] = float(processed_time_to_original_time(float(v), mapping))
        # remap word-level (if exist)
        words = seg.get("words")
        if isinstance(words, list):
            for w in words:
                for k in ("start", "end"):
                    v = w.get(k)
                    if v is not None:
                        w[k] = float(processed_time_to_original_time(float(v), mapping))
    return remapped_segments

if __name__ == "__main__":
    mapping = preprocess_audio(
        "/home/lifeng/asr_benchmark/EN2001b.Mix-Headset.wav",
        "/home/lifeng/asr_benchmark/EN2001b.Mix-Headset_trim.wav"
    )
    # Example: map 10s in processed audio to original audio time
    t_proc = 10.0
    t_orig = processed_time_to_original_time(t_proc, mapping)
    print(f"Processed {t_proc}s maps to original {t_orig:.2f}s")
