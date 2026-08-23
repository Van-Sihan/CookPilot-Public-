/**
 * 로그인·가입 카드에서 되풀이되는 입력 한 칸.
 *
 * 두 폼이 거의 같은 칸을 쓰는데, 복사해 두면 한쪽만 고치는 일이 반드시 생긴다.
 * 그림 자리·이름표 숨기기·잘못됐을 때 테두리 같은 잔손질이 여기 다 모여 있다.
 *
 * "use client" 가 없다. 이 칸은 움직이지 않아서 서버에서만 그려진다 —
 * 값을 쥐고 있는 것은 리액트가 아니라 브라우저의 입력칸 자신이고,
 * 폼을 보낼 때 name 을 보고 서버가 알아서 꺼내 간다.
 */

import { Icon, type IconName } from "@/components/icons";

type Props = {
  /** 폼이 서버로 보낼 때 붙는 이름. 서버는 이 이름으로 값을 꺼낸다 */
  name: string;
  /** 눈에는 안 보이고 읽어 주는 기계만 읽는 이름표 */
  label: string;
  /** 왼쪽에 앉는 그림 */
  icon: IconName;
  /** 칸에 흐리게 비치는 예시 */
  placeholder: string;
  /** email 이면 휴대폰에서 골뱅이 자판이, password 면 점으로 가려진다.
      text 는 닉네임처럼 가릴 것도 자판을 바꿀 것도 없는 평범한 글자 칸이다 */
  type: "email" | "password" | "text";
  /** 브라우저가 저장해 둔 값을 채워 줄 때 쓰는 이름 */
  autoComplete: string;
  /** 화면을 새로 그렸을 때 되살릴 값. 이메일에만 쓴다 */
  defaultValue?: string;
  /** 지금 잘못됐다고 표시할지. 테두리 색과 읽어 주는 기계의 안내가 달라진다 */
  invalid: boolean;
  /** 잘못됐을 때 같이 읽어 줄 잔소리 문단의 이름 */
  errorId: string;
};

// [F1][함수] AuthField({...}): 로그인·가입 폼이 함께 쓰는 입력칸 하나
// 입력: 이름표·타입·기본값·오류 여부 등 → 출력: 화면(JSX)
// 비밀번호 칸이면 눈 아이콘으로 보이기·숨기기를 뒤집는다(브라우저에서 도는 유일한 상태)
export function AuthField({
  name,
  label,
  icon,
  placeholder,
  type,
  autoComplete,
  defaultValue,
  invalid,
  errorId,
}: Props) {
  // 이름표와 입력칸을 잇는 이름. 폼이 둘 있어도 겹치지 않게 name 을 그대로 쓴다
  const id = `auth-${name}`;

  return (
    <div className="login-field">
      {/* 이름표를 눈에는 안 보이게 숨긴다. 대신 읽어 주는 기계는 읽을 수 있게 남겨 둔다 */}
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>

      {/* 그림은 뜻을 옆 칸이 전하므로 읽어 주는 기계에는 숨긴다 */}
      <span className="login-field-ico" aria-hidden="true">
        <Icon name={icon} size={19} />
      </span>

      <input
        id={id}
        // 서버가 이 이름으로 값을 꺼낸다. 틀리면 빈 값이 넘어간다
        name={name}
        className="login-input"
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        // 이메일에 맞춤법 검사나 첫 글자 대문자 만들기는 방해만 된다
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        // 잘못됐을 때 읽어 주는 기계가 아래 잔소리도 같이 읽도록 이어 준다
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
      />
    </div>
  );
}
