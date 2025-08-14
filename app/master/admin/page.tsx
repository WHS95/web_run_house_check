"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Users, 
  Key,
  Shield,
  Building2
} from "lucide-react";
import PopupNotification, {
  NotificationType,
} from "@/components/molecules/common/PopupNotification";
import { haptic } from "@/lib/haptic";

// 간단한 Textarea 컴포넌트
const Textarea = ({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  return (
    <textarea
      className={`flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
};

// 간단한 Tabs 컴포넌트들
const Tabs = ({ children, value, onValueChange }: { 
  children: React.ReactNode; 
  value: string; 
  onValueChange: (value: string) => void;
}) => {
  return (
    <div data-orientation="horizontal" className="w-full">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { value, onValueChange } as any);
        }
        return child;
      })}
    </div>
  );
};

const TabsList = ({ children, className, ...props }: { children: React.ReactNode; className?: string; value?: string; onValueChange?: (value: string) => void }) => {
  return (
    <div className={`inline-flex h-9 items-center justify-center rounded-lg p-1 text-muted-foreground ${className}`} {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { value: props.value, onValueChange: props.onValueChange } as any);
        }
        return child;
      })}
    </div>
  );
};

const TabsTrigger = ({ children, value: triggerValue, className, value, onValueChange, ...props }: { 
  children: React.ReactNode; 
  value: string; 
  className?: string;
  onValueChange?: (value: string) => void;
}) => {
  const isActive = value === triggerValue;
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isActive ? 'bg-background text-foreground shadow' : ''} ${className}`}
      onClick={() => onValueChange?.(triggerValue)}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ children, value: contentValue, value, className, ...props }: { 
  children: React.ReactNode; 
  value: string;
  className?: string;
}) => {
  if (value !== contentValue) return null;
  return (
    <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

interface Crew {
  id: string;
  name: string;
  description: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface InviteCode {
  id: number;
  crew_id: string;
  invite_code: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  crew_name?: string;
}

export default function MasterAdminPage() {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("crews");
  
  // 알림 상태
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
  } | null>(null);

  // 크루 생성 폼 상태
  const [newCrew, setNewCrew] = useState({
    name: "",
    description: "",
  });
  const [isCreatingCrew, setIsCreatingCrew] = useState(false);

  // 초대 코드 생성 폼 상태
  const [newInviteCode, setNewInviteCode] = useState({
    crew_id: "",
    description: "",
  });
  const [isCreatingCode, setIsCreatingCode] = useState(false);

  // 코드 표시 상태
  const [visibleCodes, setVisibleCodes] = useState<Set<number>>(new Set());

  // 알림 표시 함수
  const showNotification = (message: string, type: NotificationType) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 데이터 로드
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [crewsResponse, codesResponse] = await Promise.all([
        fetch("/api/master/crews"),
        fetch("/api/master/invite-codes"),
      ]);

      if (crewsResponse.ok) {
        const crewsResult = await crewsResponse.json();
        if (crewsResult.success) {
          setCrews(crewsResult.data || []);
        }
      }

      if (codesResponse.ok) {
        const codesResult = await codesResponse.json();
        if (codesResult.success) {
          setInviteCodes(codesResult.data || []);
        }
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      showNotification("데이터를 불러오는데 실패했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 크루 생성
  const handleCreateCrew = async () => {
    if (!newCrew.name.trim()) {
      showNotification("크루 이름을 입력해주세요.", "error");
      return;
    }

    setIsCreatingCrew(true);
    haptic.medium();

    try {
      const response = await fetch("/api/master/crews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCrew.name.trim(),
          description: newCrew.description.trim() || null,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showNotification(`크루 "${newCrew.name}"가 성공적으로 생성되었습니다.`, "success");
        setNewCrew({ name: "", description: "" });
        await loadData(); // 데이터 새로고침
      } else {
        showNotification(result.message || "크루 생성에 실패했습니다.", "error");
      }
    } catch (error) {
      console.error("크루 생성 오류:", error);
      showNotification("크루 생성 중 오류가 발생했습니다.", "error");
    } finally {
      setIsCreatingCrew(false);
    }
  };

  // 초대 코드 생성
  const handleCreateInviteCode = async () => {
    if (!newInviteCode.crew_id) {
      showNotification("크루를 선택해주세요.", "error");
      return;
    }

    setIsCreatingCode(true);
    haptic.medium();

    try {
      const response = await fetch("/api/master/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crew_id: newInviteCode.crew_id,
          description: newInviteCode.description.trim() || null,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showNotification("초대 코드가 성공적으로 생성되었습니다.", "success");
        setNewInviteCode({ crew_id: "", description: "" });
        await loadData(); // 데이터 새로고침
      } else {
        showNotification(result.message || "초대 코드 생성에 실패했습니다.", "error");
      }
    } catch (error) {
      console.error("초대 코드 생성 오류:", error);
      showNotification("초대 코드 생성 중 오류가 발생했습니다.", "error");
    } finally {
      setIsCreatingCode(false);
    }
  };

  // 코드 복사
  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showNotification("초대 코드가 클립보드에 복사되었습니다.", "success");
      haptic.light();
    } catch (error) {
      showNotification("복사에 실패했습니다.", "error");
    }
  };

  // 코드 표시/숨김 토글
  const toggleCodeVisibility = (codeId: number) => {
    setVisibleCodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(codeId)) {
        newSet.delete(codeId);
      } else {
        newSet.add(codeId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-basic-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-basic-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-basic-black text-white">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-basic-black-gray border-b border-basic-gray">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-basic-blue" />
            <div>
              <h1 className="text-lg font-semibold">마스터 관리자</h1>
              <p className="text-sm text-gray-300">크루 생성 및 초대 코드 관리</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-basic-black-gray">
            <TabsTrigger 
              value="crews" 
              className="flex items-center space-x-2 data-[state=active]:bg-basic-blue data-[state=active]:text-white"
            >
              <Building2 className="w-4 h-4" />
              <span>크루 관리</span>
            </TabsTrigger>
            <TabsTrigger 
              value="codes" 
              className="flex items-center space-x-2 data-[state=active]:bg-basic-blue data-[state=active]:text-white"
            >
              <Key className="w-4 h-4" />
              <span>초대 코드</span>
            </TabsTrigger>
          </TabsList>

          {/* 크루 관리 탭 */}
          <TabsContent value="crews" className="space-y-4">
            {/* 크루 생성 카드 */}
            <Card className="bg-basic-black-gray border-basic-gray">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>새 크루 생성</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    placeholder="크루 이름"
                    value={newCrew.name}
                    onChange={(e) => setNewCrew(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-basic-black border-basic-gray text-white placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="크루 설명 (선택사항)"
                    value={newCrew.description}
                    onChange={(e) => setNewCrew(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-basic-black border-basic-gray text-white placeholder:text-gray-400"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleCreateCrew}
                  disabled={isCreatingCrew || !newCrew.name.trim()}
                  className="w-full bg-basic-blue hover:bg-blue-600 text-white"
                >
                  {isCreatingCrew ? "생성 중..." : "크루 생성"}
                </Button>
              </CardContent>
            </Card>

            {/* 크루 목록 */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>생성된 크루 ({crews.length}개)</span>
              </h3>
              
              {crews.length === 0 ? (
                <Card className="bg-basic-black-gray border-basic-gray">
                  <CardContent className="py-8 text-center">
                    <Building2 className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400">생성된 크루가 없습니다.</p>
                  </CardContent>
                </Card>
              ) : (
                crews.map((crew) => (
                  <Card key={crew.id} className="bg-basic-black-gray border-basic-gray">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{crew.name}</h4>
                          {crew.description && (
                            <p className="text-sm text-gray-300 mt-1">{crew.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            생성일: {new Date(crew.created_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-basic-blue text-white border-basic-blue">
                          ID: {crew.id.slice(0, 8)}...
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* 초대 코드 관리 탭 */}
          <TabsContent value="codes" className="space-y-4">
            {/* 초대 코드 생성 카드 */}
            <Card className="bg-basic-black-gray border-basic-gray">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>새 초대 코드 생성</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <select
                    value={newInviteCode.crew_id}
                    onChange={(e) => setNewInviteCode(prev => ({ ...prev, crew_id: e.target.value }))}
                    className="w-full p-2 bg-basic-black border border-basic-gray rounded-md text-white"
                  >
                    <option value="">크루 선택</option>
                    {crews.map((crew) => (
                      <option key={crew.id} value={crew.id}>
                        {crew.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Input
                    placeholder="코드 설명 (선택사항)"
                    value={newInviteCode.description}
                    onChange={(e) => setNewInviteCode(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-basic-black border-basic-gray text-white placeholder:text-gray-400"
                  />
                </div>
                <Button
                  onClick={handleCreateInviteCode}
                  disabled={isCreatingCode || !newInviteCode.crew_id}
                  className="w-full bg-basic-blue hover:bg-blue-600 text-white"
                >
                  {isCreatingCode ? "생성 중..." : "초대 코드 생성"}
                </Button>
              </CardContent>
            </Card>

            {/* 초대 코드 목록 */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>생성된 초대 코드 ({inviteCodes.length}개)</span>
              </h3>
              
              {inviteCodes.length === 0 ? (
                <Card className="bg-basic-black-gray border-basic-gray">
                  <CardContent className="py-8 text-center">
                    <Key className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400">생성된 초대 코드가 없습니다.</p>
                  </CardContent>
                </Card>
              ) : (
                inviteCodes.map((code) => (
                  <Card key={code.id} className="bg-basic-black-gray border-basic-gray">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-white">
                              {code.crew_name || `크루 ID: ${code.crew_id.slice(0, 8)}...`}
                            </h4>
                            {code.description && (
                              <p className="text-sm text-gray-300 mt-1">{code.description}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              생성일: {new Date(code.created_at).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                          <Badge 
                            variant={code.is_active ? "outline" : "destructive"} 
                            className={code.is_active 
                              ? "bg-green-600 text-white border-green-600" 
                              : "bg-red-600 text-white border-red-600"
                            }
                          >
                            {code.is_active ? "활성" : "비활성"}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-2 p-3 bg-basic-black rounded-lg">
                          <code className="flex-1 text-lg font-mono text-basic-blue">
                            {visibleCodes.has(code.id) ? code.invite_code : "*".repeat(code.invite_code.length)}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleCodeVisibility(code.id)}
                            className="text-gray-400 hover:text-white"
                          >
                            {visibleCodes.has(code.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(code.invite_code)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 알림 */}
      {notification && (
        <PopupNotification
          isVisible={!!notification}
          message={notification.message}
          type={notification.type}
          duration={3000}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}