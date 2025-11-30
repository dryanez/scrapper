
import React, { useState } from 'react';
import { agentSDK } from "@/agents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';

export default function AmeosScraper() {
    const [url, setUrl] = useState("https://karriere.ameos.eu/offene-stellen");
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState("");
    const [conversationId, setConversationId] = useState(null);

    const handleFindJobs = async () => {
        if (!url) return;

        setIsLoading(true);
        setResults("");

        try {
            const conversation = await agentSDK.createConversation({
                agent_name: "ameos_scraper",
                metadata: { name: `AMEOS Scan: ${url}` }
            });
            setConversationId(conversation.id);

            const unsubscribe = agentSDK.subscribeToConversation(conversation.id, (data) => {
                const lastMessage = data.messages[data.messages.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                    setResults(lastMessage.content);
                    if (lastMessage.status === 'completed' || lastMessage.status === 'failed') {
                        setIsLoading(false);
                        unsubscribe();
                    }
                }
            });

            await agentSDK.addMessage(conversation, {
                role: "user",
                content: `Please process the following URL: ${url}`
            });

        } catch (error) {
            console.error("Error interacting with agent:", error);
            setResults(`An error occurred: ${error.message}`);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-4xl mx-auto">
                <Card className="mb-8 bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <BrainCircuit className="w-6 h-6 text-blue-600" />
                            <span className="text-2xl">AMEOS Job Scraper Agent</span>
                        </CardTitle>
                        <p className="text-slate-600">
                            A specialized agent to find "Assistenzarzt" positions on AMEOS career sites.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Input
                                type="url"
                                placeholder="Paste AMEOS URL here..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="h-10"
                            />
                            <Button onClick={handleFindJobs} disabled={isLoading} className="h-10">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Finding Jobs...
                                    </>
                                ) : (
                                    "Find Jobs"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading && !results && (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                                <Loader2 className="w-8 h-8 mb-4 animate-spin" />
                                <p>The agent is working... this may take a moment.</p>
                            </div>
                        )}
                        <div className="prose prose-sm prose-slate max-w-none">
                            <ReactMarkdown>{results}</ReactMarkdown>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
