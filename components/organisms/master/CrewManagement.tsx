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
  Key
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
            {crews.map((crew) => (
              <Card key={crew.id} className="bg-basic-black-gray border-basic-gray hover:border-basic-blue transition-colors">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-white">{crew.name}</h4>
                        <Badge variant="outline" className="bg-basic-blue text-white border-basic-blue text-xs">
                          ID: {crew.id.slice(0, 8)}...
                        </Badge>
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}