import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Bot } from 'lucide-react';
import { InvokeLLM } from '@/api/localApi';

export default function TemplateEditorModal({ isOpen, onClose, onSave }) {
    const [templateName, setTemplateName] = useState('');
    const [outputStyle, setOutputStyle] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [focusType, setFocusType] = useState('');
    const [generatedTemplate, setGeneratedTemplate] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [step, setStep] = useState(1); // 1 for inputs, 2 for editor

    const handleGenerate = async () => {
        if (!outputStyle || !targetAudience || !focusType) {
            console.error("Please fill all fields");
            return;
        }
        setIsGenerating(true);
        const prompt = `Create a markdown template for a meeting summary.
        - The target audience is: ${targetAudience}.
        - The desired output style is: ${outputStyle}.
        - The main focus should be on: ${focusType}.
        
        Use relevant placeholders like {{title}}, {{date}}, {{participants}}, {{key_decisions}}, {{action_items}}, etc. The template should be ready to use.`;

        try {
            // Using a mock response for UI development to avoid actual API calls during this phase.
            // In a real scenario, you would use: const response = await InvokeLLM({ prompt });
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
            const response = `# {{title}}\n\n**Date:** {{date}}\n**Participants:** {{participants}}\n\n## Key Decisions\n- \n\n## Action Items\n- \n\n## Notes\n- `;
            setGeneratedTemplate(response);
            setStep(2);
        } catch (error) {
            console.error("Failed to generate template:", error);
            // In a real app, you might show a toast notification here
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = () => {
        if (!templateName || !generatedTemplate) {
            // Add validation feedback if needed
            return;
        }
        onSave({ name: templateName, content: generatedTemplate });
        resetAndClose();
    };

    const resetAndClose = () => {
        setTemplateName('');
        setOutputStyle('');
        setTargetAudience('');
        setFocusType('');
        setGeneratedTemplate('');
        setStep(1);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={resetAndClose}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600"/>
                        AI-Assisted Template Editor
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1 ? "Describe your template, and let AI draft it for you." : "Refine the AI-generated draft and save it to your library."}
                    </DialogDescription>
                </DialogHeader>
                
                {step === 1 && (
                    <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="output-style">Output Style</Label>
                            <Select onValueChange={setOutputStyle} value={outputStyle}>
                                <SelectTrigger id="output-style"><SelectValue placeholder="e.g., Bullet points" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bullet points">Bullet Points</SelectItem>
                                    <SelectItem value="narrative paragraph">Narrative Paragraph</SelectItem>
                                    <SelectItem value="structured JSON">Structured JSON</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="target-audience">Target Audience</Label>
                            <Select onValueChange={setTargetAudience} value={targetAudience}>
                                <SelectTrigger id="target-audience"><SelectValue placeholder="e.g., Internal memo" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="internal team memo">Internal Team Memo</SelectItem>
                                    <SelectItem value="client-facing summary">Client-Facing Summary</SelectItem>
                                    <SelectItem value="personal notes">Personal Notes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="focus-type">Focus Type</Label>
                            <Select onValueChange={setFocusType} value={focusType}>
                                <SelectTrigger id="focus-type"><SelectValue placeholder="e.g., Action items" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="action items and tasks">Action Items</SelectItem>
                                    <SelectItem value="project timeline and milestones">Timeline</SelectItem>
                                    <SelectItem value="key decisions and outcomes">Decision Flow</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 py-4">
                         <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800 flex items-start gap-3">
                            <Bot className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                            <span>Here's a draft to get you started. You can edit it below and give it a name before saving.</span>
                         </div>
                         <div className="space-y-2">
                            <Label htmlFor="template-name">Template Name</Label>
                            <Input
                                id="template-name"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                placeholder="My New Meeting Template"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="template-content">Template Content</Label>
                            <Textarea
                                id="template-content"
                                value={generatedTemplate}
                                onChange={(e) => setGeneratedTemplate(e.target.value)}
                                className="h-48 font-mono text-xs"
                            />
                        </div>
                    </div>
                )}
                
                <DialogFooter>
                    {step === 1 && (
                        <Button onClick={handleGenerate} disabled={isGenerating || !outputStyle || !targetAudience || !focusType}>
                            {isGenerating ? 'Generating...' : 'AI Generate'}
                        </Button>
                    )}
                    {step === 2 && (
                        <>
                            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                            <Button onClick={handleSave} disabled={!templateName}>Save to Library</Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}