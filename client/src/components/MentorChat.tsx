import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";

interface Message {
  id: string;
  role: "user" | "mentor";
  content: string;
  timestamp: Date;
}

interface MentorChatProps {
  dashboardData: {
    totalOrders: number;
    totalRevenue: number;
    totalProfit: number;
    profitMargin: number;
    avgOrderValue: number;
    topProducts: Array<{
      name: string;
      count: number;
      totalProfit: number;
    }>;
    statusDistribution: Array<{
      name: string;
      value: number;
      percentage: number;
    }>;
    stateDistribution: Array<{
      name: string;
      value: number;
    }>;
    logisticsDistribution: Array<{
      name: string;
      value: number;
    }>;
    periodDays?: number;
    dateRange?: {
      start: string;
      end: string;
    };
  };
}

export function MentorChat({ dashboardData }: MentorChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "mentor",
      content:
        "Olá! Sou seu mentor de e-commerce. Você pode me fazer perguntas sobre seus dados, pedir conselhos específicos ou explorar estratégias para melhorar seus resultados. O que gostaria de saber?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const mentorChatMutation = trpc.insights.mentorChat.useMutation();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await mentorChatMutation.mutateAsync({
        userMessage: input,
        dashboardData,
        conversationHistory: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const mentorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "mentor",
        content: response.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, mentorMessage]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "mentor",
        content:
          "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full w-full rounded-lg border bg-muted/50 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-card text-card-foreground border rounded-bl-none"
                  }`}
                >
                  {message.role === "mentor" ? (
                    <Streamdown>{message.content}</Streamdown>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Faça uma pergunta ao mentor..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
          size="icon"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
