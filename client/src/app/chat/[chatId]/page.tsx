"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
	role: "user" | "assistant";
	content: string;
	sources?: string[];
}

export default function ChatPage() {
	const { chatId } = useParams() as { chatId: string };
	const scrollAreaRef = useRef<HTMLDivElement>(null);

	const [chatLog, setChatLog] = useState<Message[]>([]);
	const [userMessage, setUserMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	useEffect(() => {
		if (!chatId) return;
	    
		const stored = localStorage.getItem("myChats");
		const myChats = stored ? JSON.parse(stored) : [];
		if (!myChats.includes(chatId)) {
		  myChats.push(chatId);
		  localStorage.setItem("myChats", JSON.stringify(myChats));
		}
	}, [chatId]);
	
	useEffect(() => {
		if (!chatId) return;

		async function fetchChat() {
			try {
				const res = await fetch(`http://localhost:8000/load-chat/${chatId}`);

				// If the server indicates that no chat exists (like a 404),
				// assume it's a new chat with no prior messages
				if (!res.ok) {
					console.warn("No existing chat found. Possibly a new chat.");
					setChatLog([]);
					return;
				}

				// Otherwise, parse the JSON
				const data = await res.json();
				// If the server returns { messages: [...] }, set them
				if (data.messages && Array.isArray(data.messages)) {
					setChatLog(data.messages);
				} else {
					// If there's no .messages or it's not an array,
					// assume no prior messages
					setChatLog([]);
				}
			} catch (err) {
				console.error("Failed to load chat:", err);
				// Fallback to empty conversation
				setChatLog([]);
			}
		}

		fetchChat();
	}, [chatId]);

	useEffect(() => {
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
		}
	}, [chatLog]);

	const handleSend = async () => {
		if (!userMessage.trim()) return;

		const newUserMsg: Message = { role: "user", content: userMessage };
		setChatLog((prev) => [...prev, newUserMsg]);
		setUserMessage("");
		setIsLoading(true);

		try {
			const response = await fetch(`http://localhost:8000/ask/${chatId}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ question: userMessage }),
			});

			const data = await response.json();

			const newAssistantMsg: Message = {
				role: "assistant",
				content: data.response || "No response",
				sources: data.sources || [],
			};
			setChatLog((prev) => [...prev, newAssistantMsg]);
		} catch (err) {
			console.error("Failed to send message:", err);
			setChatLog((prev) => [
				...prev,
				{ role: "assistant", content: `Error: ${String(err)}` },
			]);
		} finally {
			setIsLoading(false);
		}
	};
	
	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
			<div className="mx-auto max-w-4xl space-y-4">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href="/">
							<ArrowLeft className="h-4 w-4" />
							<span className="sr-only">Back to home</span>
						</Link>
					</Button>
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Chat Session</h1>
						<p className="text-sm text-muted-foreground">ID: {chatId}</p>
					</div>
				</div>

				<Card className="border-none shadow-lg">
					<CardHeader className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
						<CardTitle>Conversation</CardTitle>
						<CardDescription>
							Ask questions about the PDF or continue a conversation
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						<ScrollArea className="h-[600px] p-4" ref={scrollAreaRef}>
							<div className="space-y-4">
								{chatLog.map((msg, idx) => {
									const isAssistant = msg.role === "assistant";
									return (
										<div
											key={idx}
											className={`flex flex-col ${isAssistant ? "items-start" : "items-end"
												}`}
										>
											<div
												className={`rounded-lg px-4 py-2 max-w-[80%] ${isAssistant
														? "bg-muted"
														: "bg-primary text-primary-foreground"
													}`}
											>
												<div className="text-sm">{msg.content}</div>
												{isAssistant && msg.sources && msg.sources.length > 0 && (
													<div className="mt-2 text-xs">
														<p className="font-medium text-muted-foreground">
															Citations:
														</p>
														<ul className="list-disc pl-4 space-y-1 text-muted-foreground">
															{msg.sources.map((src, i) => (
																<li key={i}>{src}</li>
															))}
														</ul>
													</div>
												)}
											</div>
										</div>
									);
								})}
								{isLoading && (
									<div className="flex items-start">
										<div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
											<div className="flex items-center gap-2">
												<div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
												<div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]" />
												<div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.4s]" />
											</div>
										</div>
									</div>
								)}
							</div>
						</ScrollArea>
						<div className="border-t p-4">
							<form
								onSubmit={(e) => {
									e.preventDefault();
									handleSend();
								}}
								className="flex items-center gap-2"
							>
								<Input
									placeholder="Type your message..."
									value={userMessage}
									onChange={(e) => setUserMessage(e.target.value)}
									disabled={isLoading}
								/>
								<Button type="submit" disabled={isLoading}>
									<Send className="h-4 w-4" />
									<span className="sr-only">Send message</span>
								</Button>
							</form>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
