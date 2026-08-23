import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountForm } from "@/components/write/account-form";
import { PhotoForm } from "@/components/write/photo-form";
import {
  CommunityFoot,
  CommunityTop,
} from "@/components/community/community-chrome";
import { Icon } from "@/components/icons";
import { supabaseProfileGateway } from "@/lib/adapter/supabase-profile-gateway";
import { currentUserEmail } from "@/lib/adapter/supabase-auth-gateway";
import { accountCopy } from "@/lib/write-content";

/* 내 것만 보이는 자리라 검색에 나올 이유가 없다 */
export const metadata: Metadata = {
  title: accountCopy.title,
  description: accountCopy.lead,
  robots: { index: false, follow: false },
};

/**
 * /account — 계정 설정.
 *
 * 전에는 닉네임만 바꾸는 화면이었다. 목소리와 API 키는 홈 왼쪽 기둥에
 * 작은 링크로 흩어져 있었는데, 그 자리는 눈에 잘 안 띄면서도 홈을 어지럽혔다.
 * 자주 쓰지 않지만 어디 있는지는 늘 알아야 하는 것들이라 **한 자리에 모았다.**
 * 홈에서는 톱니바퀴 하나로 여기 들어온다.
 */
// [F1][함수] AccountPage(): 계정 설정 화면 (/account)
// 입력: 없음 → 처리: 로그인 확인 → 내 프로필 조회 → 사진·닉네임 폼과 채비 링크 배치
// 출력: 화면(JSX) 또는 redirect
export default async function AccountPage() {
  // [F2][외부] ▷ currentUserEmail(supabase-auth-gateway:F12) → email
  const email = await currentUserEmail().catch(() => null);
  // [F3][분기] 로그인 안 함 → true: ▷ redirect('/login?next=/account') / false: F4
  if (!email) redirect("/login?next=/account");

  /* 지금 이름과 사진을 서버에서 읽어 미리 채워 둔다.
     빈 칸으로 두면 지금 무엇이었는지 보러 나갔다 와야 한다 */
  // [F4][외부] ▷ supabaseProfileGateway.myProfile(F3) → profiles select → profile
  const profile = await supabaseProfileGateway.myProfile();

  // [F5][흐름] profile.name → name / profile.avatar → PhotoForm 과 AccountForm 에 넘긴다
  // PhotoForm → setPhotoAction(actions/post:F29) · AccountForm → renameAction(actions/post:F7)
  const name = profile?.name ?? "";

  return (
    <>
      <a className="skip" href="#ac-main">
        본문으로 건너뛰기
      </a>

      <CommunityTop />

      <main className="ask-page glow" id="ac-main">
        <div className="ask-wrap">
          <header className="ask-head">
            <Link className="pd-back" href="/community">
              ← 커뮤니티로
            </Link>

            <h1 className="ask-title">{accountCopy.title}</h1>
            <p className="ask-lead">{accountCopy.lead}</p>
          </header>

          {/* 사진과 이름을 위아래로 둔다. 둘 다 "남에게 보이는 나" 다 */}
          <PhotoForm name={name || email.split("@")[0]} avatar={profile?.avatar ?? null} />

          <AccountForm email={email} name={name} />

          {/* ---------- 요리 채비 ----------
              고치는 칸이 아니라 다른 화면으로 가는 길이라 폼과 나눠 둔다 */}
          <section className="ac-links">
            <h2 className="wr-l">{accountCopy.setupLabel}</h2>
            <p className="wr-note">{accountCopy.setupNote}</p>

            <div className="ac-links-row">
              <Link className="btn btn-line" href="/start/model">
                <Icon name="mic" size={16} /> {accountCopy.toVoice}
              </Link>

              <Link className="btn btn-line" href="/start">
                <Icon name="key" size={16} /> {accountCopy.toKey}
              </Link>

              <Link className="btn btn-line" href="/shelf">
                <Icon name="book" size={16} /> {accountCopy.toShelf}
              </Link>
            </div>
          </section>
        </div>
      </main>

      <CommunityFoot />
    </>
  );
}
