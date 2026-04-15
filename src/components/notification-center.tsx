"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "ALERT" | "ERROR";
  isRead: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.ok ? await res.json() : { notifications: [], unreadCount: 0 };
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  async function markAsRead(id?: string, all = false) {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id, all }),
      });
      if (res.ok) {
        if (all) {
          setNotifications(n => n.map(item => ({ ...item, isRead: true })));
          setUnreadCount(0);
        } else {
          setNotifications(n => n.map(item => item.id === id ? { ...item, isRead: true } : item));
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error("Failed to mark notification as read");
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white rounded-full border-2 border-background animate-in zoom-in"
            variant="destructive"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => setIsOpen(false)} 
          />
          <Card className="absolute right-0 mt-2 w-80 md:w-96 shadow-xl z-50 animate-in slide-in-from-top-2 duration-200">
            <CardHeader className="py-3 flex flex-row items-center justify-between border-b">
              <div>
                <CardTitle className="text-sm font-bold">Notifications</CardTitle>
                <CardDescription className="text-xs">
                  {unreadCount} unread alerts
                </CardDescription>
              </div>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => markAsRead(undefined, true)}
                >
                  Mark all as read
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-80">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    No notifications yet.
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "p-4 flex gap-3 transition-colors",
                          n.isRead ? "bg-background opacity-70" : "bg-blue-50/30"
                        )}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                                "text-xs font-bold px-1.5 py-0.5 rounded border uppercase",
                                n.type === "SUCCESS" ? "bg-green-100 text-green-700 border-green-200" :
                                n.type === "ALERT" ? "bg-orange-100 text-orange-700 border-orange-200" :
                                n.type === "ERROR" ? "bg-red-100 text-red-700 border-red-200" :
                                "bg-blue-100 text-blue-700 border-blue-200"
                            )}>
                              {n.type}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className={cn("text-xs font-semibold", !n.isRead && "font-bold text-foreground")}>{n.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed italic line-clamp-2">
                             "{n.message}"
                          </p>
                          {!n.isRead && (
                            <button
                              onClick={() => markAsRead(n.id)}
                              className="text-[10px] text-blue-600 font-medium hover:underline mt-1"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="p-2 border-t text-center">
                 <Button variant="ghost" size="sm" className="w-full text-xs hover:bg-transparent" onClick={() => setIsOpen(false)}>
                    Close
                 </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
