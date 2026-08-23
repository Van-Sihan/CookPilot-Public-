import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountForm } from "@/components/write/account-form";
import {
  CommunityFoot,
  CommunityTop,
} from "@/components/community/community-chrome";
import { supabaseProfileGateway } from "@/lib/adapter/supabase-profile-gateway";
import { currentUserEmail } from "@/lib/adapter/supabase-auth-gateway";
import { accountCopy } from "@/lib/write-content";

/* 내 것만 보이는 자리라 검색에 나올 이유가 없다 */
export const metadata: Metadata = {
  title: accountCopy.title,
  description: accountCopy.lead,
  robots: { index: false, follow: false },
};

/** /account — 닉네임을 바꾸는 곳 */
export default async function AccountPage() {
  const email = await currentUserEmail().catch(() => null);
  if (!email) redirect("/login?next=/account");

  /* 지금 이름을 서버에서 읽어 칸에 미리 채워 둔다.
     빈 칸으로 두면 지금 이름이 뭐였는지 보러 나갔다 와야 한다 */
  const name = await supabaseProfileGateway.myName();

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

          <AccountForm email={email} name={name ?? ""} />
        </div>
      </main>

      <CommunityFoot />
    </>
  );
}
