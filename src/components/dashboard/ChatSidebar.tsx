import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const mockMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content: "Hello! I'm your health assistant. Ask me anything about your health data, request summaries, or get personalized recommendations.",
  },
];

export const ChatSidebar = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: input,
    };

    setMessages([...messages, newMessage]);

    // Mock assistant response
    setTimeout(() => {
      const response: Message = {
        id: messages.length + 2,
        role: "assistant",
        content: "I understand you'd like information about that. In a production version, I would analyze your health data and provide personalized insights. This is a demo interface.",
      };
      setMessages((prev) => [...prev, response]);
    }, 1000);

    setInput("");
  };

  return (
    <Card className="lg:w-96 lg:m-6 lg:mr-6 border-l lg:border rounded-none lg:rounded-xl shadow-lg">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Health Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-[calc(100vh-8rem)] lg:h-[600px]">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about your health..."
            />
            <Button onClick={handleSend} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ChatMessage = ({ message }: { message: Message }) => {
  const isUser = message.role === "user";
  
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`p-2 rounded-full h-8 w-8 flex items-center justify-center ${
        isUser ? "bg-accent" : "bg-primary/10"
      }`}>
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-primary" />
        )}
      </div>
      <div className={`flex-1 p-3 rounded-lg ${
        isUser ? "bg-accent text-white" : "bg-muted"
      }`}>
        <p className="text-sm leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
};
