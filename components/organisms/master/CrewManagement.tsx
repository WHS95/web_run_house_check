"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Building2,
  Calendar,
  Users,
  Key,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Shield,
  Crown
} from "lucide-react";
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

interface Crew {
  id: string;
  name: string;
  description: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CrewMember {
  id: string;
  first_name: string;
  email: string;
  phone: string | null;
  birth_year: number | null;
  profile_image_url: string | null;
  is_crew_verified: boolean;
  created_at: string;
  crew_role: string;
}

interface CrewManagementProps {
  crews: Crew[];
  onCrewCreated: () => void;
  showNotification: (message: string, type: "success" | "error") => void;
}

export default function CrewManagement({ crews, onCrewCreated, showNotification }: CrewManagementProps) {
  // 크루 생성 폼 상태
  const [newCrew, setNewCrew] = useState({
    name: "",
    description: "",
    createInviteCode: true, // 초대 코드 자동 생성 옵션
    inviteCodeDescription: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  // 크루 멤버 관리 상태
  const [expandedCrews, setExpandedCrews] = useState<Set<string>>(new Set());
  const [crewMembers, setCrewMembers] = useState<Record<string, CrewMember[]>>({});
  const [loadingMembers, setLoadingMembers] = useState<Set<string>>(new Set());
  const [updatingMembers, setUpdatingMembers] = useState<Set<string>>(new Set());

  // 크루 멤버 조회
  const loadCrewMembers = async (crewId: string) => {
    setLoadingMembers(prev => new Set([...prev, crewId]));
    
    try {
      const response = await fetch(`/api/master/crew-members?crewId=${crewId}`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        setCrewMembers(prev => ({ ...prev, [crewId]: result.data || [] }));
      } else {
        showNotification("크루 멤버 조회에 실패했습니다.", "error");
      }
    } catch (error) {
      console.error("크루 멤버 조회 오류:", error);
      showNotification("크루 멤버 조회 중 오류가 발생했습니다.", "error");
    } finally {
      setLoadingMembers(prev => {
        const newSet = new Set(prev);
        newSet.delete(crewId);
        return newSet;
      });
    }
  };

  // 크루 확장/축소 토글
  const toggleCrewExpansion = async (crewId: string) => {
    const isExpanded = expandedCrews.has(crewId);
    
    if (isExpanded) {
      setExpandedCrews(prev => {
        const newSet = new Set(prev);
        newSet.delete(crewId);
        return newSet;
      });
    } else {
      setExpandedCrews(prev => new Set([...prev, crewId]));
      // 멤버 데이터가 없으면 로드
      if (!crewMembers[crewId]) {
        await loadCrewMembers(crewId);
      }
    }
  };

  // 운영진 권한 변경
  const handleRoleChange = async (crewId: string, userId: string, currentRole: string) => {
    const newRole = currentRole === "CREW_MANAGER" ? "MEMBER" : "CREW_MANAGER";
    const memberKey = `${crewId}-${userId}`;
    
    setUpdatingMembers(prev => new Set([...prev, memberKey]));
    haptic.medium();

    try {
      const response = await fetch("/api/master/crew-members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crewId,
          userId,
          newRole
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 로컬 상태 업데이트
        setCrewMembers(prev => ({
          ...prev,
          [crewId]: prev[crewId]?.map(member => 
            member.id === userId 
              ? { ...member, crew_role: newRole }
              : member
          ) || []
        }));
        
        const roleText = newRole === "CREW_MANAGER" ? "운영진" : "일반 멤버";
        showNotification(`${roleText}로 권한이 변경되었습니다.`, "success");
      } else {
        showNotification(result.message || "권한 변경에 실패했습니다.", "error");
      }
    } catch (error) {
      console.error("권한 변경 오류:", error);
      showNotification("권한 변경 중 오류가 발생했습니다.", "error");
    } finally {
      setUpdatingMembers(prev => {
        const newSet = new Set(prev);
        newSet.delete(memberKey);
        return newSet;
      });
    }
  };

  // 크루 생성 (초대 코드 포함)
  const handleCreateCrew = async () => {
    if (!newCrew.name.trim()) {
      showNotification("크루 이름을 입력해주세요.", "error");
      return;
    }

    setIsCreating(true);
    haptic.medium();

    try {
      // 1. 크루 생성
      const crewResponse = await fetch("/api/master/crews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCrew.name.trim(),
          description: newCrew.description.trim() || null,
        }),
      });

      const crewResult = await crewResponse.json();

      if (!crewResponse.ok || !crewResult.success) {
        showNotification(crewResult.message || "크루 생성에 실패했습니다.", "error");
        return;
      }

      const createdCrew = crewResult.data;

      // 2. 초대 코드 자동 생성 (옵션이 켜져 있을 경우)
      if (newCrew.createInviteCode) {
        const codeResponse = await fetch("/api/master/invite-codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            crew_id: createdCrew.id,
            description: newCrew.inviteCodeDescription.trim() || `${newCrew.name} 기본 초대 코드`,
          }),
        });

        const codeResult = await codeResponse.json();
        
        if (codeResponse.ok && codeResult.success) {
          showNotification(`크루 "${newCrew.name}"가 생성되고 초대 코드가 발급되었습니다.`, "success");
        } else {
          showNotification(`크루는 생성되었지만 초대 코드 생성에 실패했습니다.`, "error");
        }
      } else {
        showNotification(`크루 "${newCrew.name}"가 성공적으로 생성되었습니다.`, "success");
      }

      // 폼 초기화
      setNewCrew({ 
        name: "", 
        description: "", 
        createInviteCode: true, 
        inviteCodeDescription: "" 
      });
      
      // 부모 컴포넌트에 알림
      onCrewCreated();

    } catch (error) {
      console.error("크루 생성 오류:", error);
      showNotification("크루 생성 중 오류가 발생했습니다.", "error");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div className="flex items-center space-x-3">
        <Building2 className="w-6 h-6 text-basic-blue" />
        <div>
          <h1 className="text-xl font-semibold text-white">크루 관리</h1>
          <p className="text-sm text-gray-300">새로운 크루를 생성하고 관리합니다.</p>
        </div>
      </div>

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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              크루 이름 *
            </label>
            <Input
              placeholder="예: 한강 러닝 크루"
              value={newCrew.name}
              onChange={(e) => setNewCrew(prev => ({ ...prev, name: e.target.value }))}
              className="bg-basic-black border-basic-gray text-white placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              크루 설명
            </label>
            <Textarea
              placeholder="크루에 대한 간단한 설명을 입력하세요"
              value={newCrew.description}
              onChange={(e) => setNewCrew(prev => ({ ...prev, description: e.target.value }))}
              className="bg-basic-black border-basic-gray text-white placeholder:text-gray-400"
              rows={3}
            />
          </div>

          {/* 초대 코드 자동 생성 옵션 */}
          <div className="space-y-3 p-4 bg-basic-black rounded-lg border border-basic-gray">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="createInviteCode"
                checked={newCrew.createInviteCode}
                onChange={(e) => setNewCrew(prev => ({ ...prev, createInviteCode: e.target.checked }))}
                className="w-4 h-4 text-basic-blue bg-basic-black border-basic-gray rounded focus:ring-basic-blue"
              />
              <label htmlFor="createInviteCode" className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>초대 코드 자동 생성</span>
              </label>
            </div>
            
            {newCrew.createInviteCode && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  초대 코드 설명
                </label>
                <Input
                  placeholder="예: 기본 초대 코드"
                  value={newCrew.inviteCodeDescription}
                  onChange={(e) => setNewCrew(prev => ({ ...prev, inviteCodeDescription: e.target.value }))}
                  className="bg-basic-black border-basic-gray text-white placeholder:text-gray-400 text-sm"
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleCreateCrew}
            disabled={isCreating || !newCrew.name.trim()}
            className="w-full bg-basic-blue hover:bg-blue-600 text-white"
          >
            {isCreating ? "생성 중..." : (newCrew.createInviteCode ? "크루 생성 + 초대 코드 발급" : "크루 생성")}
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
          <div className="grid gap-3">
            {crews.map((crew) => {
              const isExpanded = expandedCrews.has(crew.id);
              const members = crewMembers[crew.id] || [];
              const isLoadingMembers = loadingMembers.has(crew.id);
              const managerCount = members.filter(m => m.crew_role === "CREW_MANAGER").length;
              
              return (
                <Card key={crew.id} className="bg-basic-black-gray border-basic-gray hover:border-basic-blue transition-colors">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* 크루 기본 정보 */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-white">{crew.name}</h4>
                            <Badge variant="outline" className="bg-basic-blue text-white border-basic-blue text-xs">
                              ID: {crew.id.slice(0, 8)}...
                            </Badge>
                            {managerCount > 0 && (
                              <Badge variant="outline" className="bg-green-600 text-white border-green-600 text-xs">
                                운영진 {managerCount}명
                              </Badge>
                            )}
                          </div>
                          {crew.description && (
                            <p className="text-sm text-gray-300 mb-2">{crew.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>생성: {new Date(crew.created_at).toLocaleDateString('ko-KR')}</span>
                            </div>
                            {crew.updated_at !== crew.created_at && (
                              <div className="flex items-center space-x-1">
                                <span>수정: {new Date(crew.updated_at).toLocaleDateString('ko-KR')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* 멤버 관리 버튼 */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCrewExpansion(crew.id)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Users className="w-4 h-4 mr-1" />
                          멤버 관리
                          {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                        </Button>
                      </div>

                      {/* 멤버 목록 (확장 시) */}
                      {isExpanded && (
                        <div className="border-t border-basic-gray pt-3">
                          <h5 className="text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
                            <UserCheck className="w-4 h-4" />
                            <span>크루 멤버 ({members.length}명)</span>
                          </h5>
                          
                          {isLoadingMembers ? (
                            <div className="flex justify-center items-center py-4">
                              <div className="w-5 h-5 rounded-full border-2 animate-spin border-basic-blue border-t-transparent"></div>
                              <span className="ml-2 text-sm text-gray-400">멤버 목록 로딩 중...</span>
                            </div>
                          ) : members.length === 0 ? (
                            <div className="text-center py-4">
                              <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                              <p className="text-sm text-gray-400">아직 가입한 멤버가 없습니다.</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {members.map((member) => {
                                const memberKey = `${crew.id}-${member.id}`;
                                const isUpdating = updatingMembers.has(memberKey);
                                const isManager = member.crew_role === "CREW_MANAGER";
                                
                                return (
                                  <div
                                    key={member.id}
                                    className="flex items-center justify-between p-3 bg-basic-black rounded-lg border border-basic-gray"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 rounded-full bg-basic-gray flex items-center justify-center">
                                        {isManager ? (
                                          <Crown className="w-4 h-4 text-yellow-500" />
                                        ) : (
                                          <Users className="w-4 h-4 text-gray-400" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-white">{member.first_name}</p>
                                        <p className="text-xs text-gray-400">{member.email}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      <Badge 
                                        variant="outline" 
                                        className={isManager 
                                          ? "bg-yellow-600 text-white border-yellow-600" 
                                          : "bg-gray-600 text-white border-gray-600"
                                        }
                                      >
                                        {isManager ? "운영진" : "멤버"}
                                      </Badge>
                                      
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleRoleChange(crew.id, member.id, member.crew_role)}
                                        disabled={isUpdating}
                                        className={`text-xs ${isManager 
                                          ? "text-red-400 hover:text-red-300" 
                                          : "text-green-400 hover:text-green-300"
                                        }`}
                                      >
                                        {isUpdating ? (
                                          <div className="w-3 h-3 rounded-full border animate-spin border-current border-t-transparent" />
                                        ) : isManager ? (
                                          <>
                                            <Shield className="w-3 h-3 mr-1" />
                                            운영진 해제
                                          </>
                                        ) : (
                                          <>
                                            <Crown className="w-3 h-3 mr-1" />
                                            운영진 승격
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}