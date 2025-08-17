"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Key,
  Edit,
  Save,
  X,
  Trash2,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { haptic } from "@/lib/haptic";

interface Crew {
  id: string;
  name: string;
  description: string | null;
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

interface InviteCodeManagementProps {
  crews: Crew[];
  inviteCodes: InviteCode[];
  onCodeCreated: () => void;
  showNotification: (message: string, type: "success" | "error") => void;
}

export default function InviteCodeManagement({ 
  crews, 
  inviteCodes, 
  onCodeCreated, 
  showNotification 
}: InviteCodeManagementProps) {
  // 초대 코드 생성 폼 상태
  const [newInviteCode, setNewInviteCode] = useState({
    crew_id: "",
    description: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  // 코드 표시 상태
  const [visibleCodes, setVisibleCodes] = useState<Set<number>>(new Set());
  
  // 편집 상태
  const [editingCode, setEditingCode] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    invite_code: "",
    description: "",
    is_active: true,
  });

  // 초대 코드 생성
  const handleCreateInviteCode = async () => {
    if (!newInviteCode.crew_id) {
      showNotification("크루를 선택해주세요.", "error");
      return;
    }

    setIsCreating(true);
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
        onCodeCreated();
      } else {
        showNotification(result.message || "초대 코드 생성에 실패했습니다.", "error");
      }
    } catch (error) {
      console.error("초대 코드 생성 오류:", error);
      showNotification("초대 코드 생성 중 오류가 발생했습니다.", "error");
    } finally {
      setIsCreating(false);
    }
  };

  // 초대 코드 수정
  const handleUpdateInviteCode = async (codeId: number) => {
    try {
      const response = await fetch(`/api/master/invite-codes/${codeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invite_code: editForm.invite_code.trim(),
          description: editForm.description.trim() || null,
          is_active: editForm.is_active,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showNotification("초대 코드가 성공적으로 수정되었습니다.", "success");
        setEditingCode(null);
        onCodeCreated(); // 데이터 새로고침
      } else {
        showNotification(result.message || "초대 코드 수정에 실패했습니다.", "error");
      }
    } catch (error) {
      console.error("초대 코드 수정 오류:", error);
      showNotification("초대 코드 수정 중 오류가 발생했습니다.", "error");
    }
  };

  // 편집 시작
  const startEditing = (code: InviteCode) => {
    setEditingCode(code.id);
    setEditForm({
      invite_code: code.invite_code,
      description: code.description || "",
      is_active: code.is_active,
    });
  };

  // 편집 취소
  const cancelEditing = () => {
    setEditingCode(null);
    setEditForm({ invite_code: "", description: "", is_active: true });
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

  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div className="flex items-center space-x-3">
        <Key className="w-6 h-6 text-basic-blue" />
        <div>
          <h1 className="text-xl font-semibold text-white">초대 코드 관리</h1>
          <p className="text-sm text-gray-300">크루 초대 코드를 생성하고 관리합니다.</p>
        </div>
      </div>

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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              크루 선택 *
            </label>
            <select
              value={newInviteCode.crew_id}
              onChange={(e) => setNewInviteCode(prev => ({ ...prev, crew_id: e.target.value }))}
              className="w-full p-2 bg-basic-black border border-basic-gray rounded-md text-white"
            >
              <option value="">크루를 선택하세요</option>
              {crews.map((crew) => (
                <option key={crew.id} value={crew.id}>
                  {crew.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              코드 설명
            </label>
            <Input
              placeholder="예: 신규 멤버용 초대 코드"
              value={newInviteCode.description}
              onChange={(e) => setNewInviteCode(prev => ({ ...prev, description: e.target.value }))}
              className="bg-basic-black border-basic-gray text-white placeholder:text-gray-400"
            />
          </div>

          <Button
            onClick={handleCreateInviteCode}
            disabled={isCreating || !newInviteCode.crew_id}
            className="w-full bg-basic-blue hover:bg-blue-600 text-white"
          >
            {isCreating ? "생성 중..." : "초대 코드 생성"}
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
          <div className="grid gap-3">
            {inviteCodes.map((code) => (
              <Card key={code.id} className="bg-basic-black-gray border-basic-gray hover:border-basic-blue transition-colors">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* 헤더 */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-white">
                          {code.crew_name || `크루 ID: ${code.crew_id.slice(0, 8)}...`}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          생성일: {new Date(code.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={code.is_active ? "outline" : "destructive"} 
                          className={code.is_active 
                            ? "bg-green-600 text-white border-green-600" 
                            : "bg-red-600 text-white border-red-600"
                          }
                        >
                          {code.is_active ? "활성" : "비활성"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(code)}
                          className="text-gray-400 hover:text-white p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* 편집 모드 또는 일반 모드 */}
                    {editingCode === code.id ? (
                      <div className="space-y-3 p-3 bg-basic-black rounded-lg border border-basic-gray">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            초대 코드 *
                          </label>
                          <Input
                            placeholder="초대 코드"
                            value={editForm.invite_code}
                            onChange={(e) => setEditForm(prev => ({ ...prev, invite_code: e.target.value }))}
                            className="bg-basic-black-gray border-basic-gray text-white placeholder:text-gray-400 text-sm font-mono"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            설명
                          </label>
                          <Input
                            placeholder="코드 설명"
                            value={editForm.description}
                            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            className="bg-basic-black-gray border-basic-gray text-white placeholder:text-gray-400 text-sm"
                          />
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setEditForm(prev => ({ ...prev, is_active: !prev.is_active }))}
                            className="flex items-center space-x-2 text-sm text-gray-300 hover:text-white"
                          >
                            {editForm.is_active ? 
                              <ToggleRight className="w-5 h-5 text-green-500" /> : 
                              <ToggleLeft className="w-5 h-5 text-gray-500" />
                            }
                            <span>{editForm.is_active ? "활성" : "비활성"}</span>
                          </button>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateInviteCode(code.id)}
                            disabled={!editForm.invite_code.trim()}
                            className="bg-basic-blue hover:bg-blue-600 text-white flex-1 disabled:opacity-50"
                          >
                            <Save className="w-4 h-4 mr-1" />
                            저장
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="text-gray-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* 설명 */}
                        {code.description && (
                          <p className="text-sm text-gray-300">{code.description}</p>
                        )}

                        {/* 초대 코드 */}
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
                      </>
                    )}
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