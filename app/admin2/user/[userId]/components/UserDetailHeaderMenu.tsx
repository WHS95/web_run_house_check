"use client";

import { useState, useCallback } from "react";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminModal from "@/app/admin2/components/ui/AdminModal";
import UserEditForm from "../../components/UserEditForm";
import { updateUserInfo } from "@/lib/supabase/admin";
import type { UserForAdmin } from "@/lib/supabase/admin";
import type { CrewUserDetail } from "@/lib/admin2/queries";

interface Props {
  user: CrewUserDetail["user"];
}

export default function UserDetailHeaderMenu({ user }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const handleSave = useCallback(
    async (data: { first_name: string; phone: string; birth_year: number }) => {
      const { error } = await updateUserInfo(user.id, data);
      if (error) {
        alert("정보 수정 실패");
        return;
      }
      setEditOpen(false);
      router.refresh();
    },
    [user.id, router],
  );

  // UserEditForm expects UserForAdmin; adapt minimal fields
  const userForForm: UserForAdmin = {
    ...user,
    profile_image_url: null,
    is_crew_verified: true,
    verified_crew_id: null,
  } as UserForAdmin;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label='more'
          className='flex items-center justify-center w-8 h-8 text-white active:opacity-70'
        >
          <MoreVertical size={20} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='border-0 bg-rh-bg-surface'>
          <DropdownMenuItem
            onClick={() => setEditOpen(true)}
            className='text-white hover:bg-rh-bg-muted focus:bg-rh-bg-muted'
          >
            정보 편집
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AdminModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title='사용자 정보 수정'
      >
        <UserEditForm
          user={userForForm}
          onSave={handleSave}
          onClose={() => setEditOpen(false)}
        />
      </AdminModal>
    </>
  );
}
