"use client";

import { useState, useEffect, useRef } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { LLMChain } from "langchain/chains";
import { VerfifyUser } from "@/app/utils/db";
import OpenAI from "openai";

// Add type definitions for Web Speech API
interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: { error: any }) => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

// Add this to declare the global types
declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

interface ChatInstructionProps {
    onSearch: (searchTerm: { type: string, value: string, embedding?: number[] }) => void;
}

const ChatInstruction: React.FC<ChatInstructionProps> = ({ onSearch }: ChatInstructionProps) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [processing, setProcessing] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                if (recognitionRef.current) {
                    recognitionRef.current.continuous = true;
                    recognitionRef.current.interimResults = true;

                    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
                        const currentTranscript = Array.from(event.results)
                            .map(result => result[0].transcript)
                            .join('');
                        setTranscript(currentTranscript);
                    };

                    recognitionRef.current.onerror = (event: { error: any }) => {
                        console.error('Speech recognition error', event.error);
                        setIsListening(false);
                    };

                    recognitionRef.current.onend = () => {
                        setIsListening(false);
                    };
                }
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.onresult = null;
                recognitionRef.current.onend = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.abort();
            }
        };
    }, []);

    const toggleListening = () => {
        if (isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
            // Process command when stopping listening if there's a transcript
            if (transcript.trim()) {
                processCommand();
            }
        } else {
            setTranscript('');
            if (recognitionRef.current) {
                recognitionRef.current.start();
            }
            setIsListening(true);
        }
    };

    const processCommand = async () => {
        console.log("processing command");
        if (!transcript.trim()) return;

        setProcessing(true);

        try {
            // Initialize OpenAI model through LangChain
            const model = new ChatOpenAI({
                temperature: 0,
                modelName: 'gpt-3.5-turbo', // Using smaller model for efficiency
                openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
            });

            // Initialize OpenAI API client for embeddings
            const openai = new OpenAI({
                apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
                dangerouslyAllowBrowser: true // Allow browser usage (be cautious with this)
            });

            // Create a prompt template
            const promptTemplate = PromptTemplate.fromTemplate(
                `Extract the search criteria from this voice input:
                "{text}"
                
                Respond only with a JSON object in this format:
                {{
                    "command": "search",
                    "parameters": {{
                        "type": "name" | "location" | "category",
                        "value": string
                    }}
                }}
                
                Rules:
                1. For business name searches: When user mentions "search for", "find", "look for" followed by business names
                   Example: "search for AI companies" → {{"command": "search", "parameters": {{"type": "name", "value": "AI"}}}}
                
                2. For location searches: When user mentions "in", "from", "at" followed by location names
                   Example: "show businesses in New York" → {{"command": "search", "parameters": {{"type": "location", "value": "New York"}}}}
                
                3. For category searches: When user mentions any of these categories: software, healthcare, fintech, ecommerce, ai, sustainability
                   Example: "show me fintech companies" → {{"command": "search", "parameters": {{"type": "category", "value": "fintech"}}}}
                
                If no specific search criteria is detected, respond with:
                {{"command": "other", "parameters": {{"type": "", "value": ""}}}}
                `
            );

            // Create a chain
            const chain = new LLMChain({
                llm: model,
                prompt: promptTemplate,
            });

            // Execute the chain
            const response = await chain.call({
                text: transcript,
            });
            console.log("response", response.text);
            // Parse the result but don't set it to state since we don't need to display it
            const parsedResult = JSON.parse(response.text);

            // Create embedding for the search query
            const queryText = parsedResult.parameters.value;
            const embeddingResponse = await openai.embeddings.create({
                model: 'text-embedding-ada-002',
                input: queryText,
            });
            

            // Add the embedding to the parsed result
            parsedResult.parameters.embedding = embeddingResponse.data[0].embedding;
            console.log('Query Embedding Generated:', {
                length: parsedResult.parameters.embedding.length, // Should be 1536
                sample: parsedResult.parameters.embedding.slice(0, 5), // Preview of the embedding
            });
            // Handle the command based on type
            handleCommand(parsedResult);

        } catch (error) {
            console.error('Error processing command:', error);
            // Don't set result error message
        } finally {
            setProcessing(false);
        }
    };

    const handleCommand = (parsedCommand: { command: string, parameters: any, embedding: number[] }) => {
        console.log("handleCommand", parsedCommand);
        onSearch(parsedCommand.parameters);
        // switch (parsedCommand.command) {
        //     case 'filter':
        //         console.log('Applying filter:', parsedCommand.parameters);
        //         // Add your filter function call here
        //         onSearch(parsedCommand.parameters.query);
        //         break;
        //     case 'search':
        //         console.log('Searching for:', parsedCommand.parameters?.query);
        //         // Add your search function call here
        //         break;
        //     default:
        //         console.log('Unrecognized command or general input');
        //         break;
        // }
    };

    // When you receive search terms from your chat/AI interaction
    // call the onSearch function with the search term

    return (
        <div className="flex flex-row h-[200px] bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl shadow-2xl overflow-hidden border border-blue-400/30 backdrop-blur-sm">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
            <div className="flex-1 p-4 flex flex-row items-center justify-between relative z-10">
                <div className="text-left">
                    <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200 mb-2">Tell me what you want</h2>

                    <div className="mt-2 font-medium text-blue-100 tracking-wide">
                        {isListening ? (
                            <div className="flex items-center gap-2">
                                <span>Analyzing voice input</span>
                                <span className="flex space-x-1">
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-[bounce_0.6s_infinite_0.1s]"></span>
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-[bounce_0.6s_infinite_0.2s]"></span>
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-[bounce_0.6s_infinite_0.3s]"></span>
                                </span>
                            </div>
                        ) : (
                            <span className="text-blue-200">Activate voice searching</span>
                        )}
                    </div>
                </div>

                <div className="flex flex-row items-center gap-6">
                    <div className="relative">
                        <div className={`absolute inset-0 rounded-full ${isListening ? 'bg-red-500/20' : 'bg-blue-500/20'} blur-xl transform scale-150 animate-pulse`}></div>
                        <button
                            onClick={toggleListening}
                            disabled={processing}
                            className={`relative rounded-full p-6 ${isListening ? 'bg-gradient-to-br from-red-500 to-pink-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                } text-white shadow-lg transition-all duration-500 hover:scale-110 hover:shadow-blue-500/50 z-10 ${isListening ? 'animate-pulse' : ''
                                }`}
                        >
                            <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
                            {isListening ? (
                                <FaStop className="w-6 h-6 animate-pulse" />
                            ) : (
                                <FaMicrophone className="w-6 h-6" />
                            )}
                            <span className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-8 rounded-full transition-all duration-500 ${isListening ? 'bg-red-400 animate-[grow_1s_ease-in-out_infinite]' : 'bg-transparent'
                                }`}></span>
                        </button>
                    </div>

                    {transcript && (
                        <div className="w-64">
                            <h3 className="text-sm font-medium text-blue-300 mb-1 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
                                </svg>
                                Transcript:
                            </h3>
                            <div className="p-3 bg-slate-800/70 rounded-xl border border-blue-500/20 backdrop-blur text-blue-100 shadow-lg relative overflow-hidden text-sm">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-500"></div>
                                "{transcript}"
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
                            </div>
                        </div>
                    )}

                    {processing && (
                        <div className="text-blue-300 flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Searching...
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                @keyframes grow {
                    0%, 100% { height: 8px; opacity: 0.5; }
                    50% { height: 20px; opacity: 1; }
                }
                
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
            `}</style>
        </div>
    );
};

export default ChatInstruction;

