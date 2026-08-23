# 텍스트 플로우 — 기능별 실행 흐름 (FN01 – FN13)

코드에 붙인 `[F#]` 주석과 짝을 이루는 문서다. 기능 하나마다 **흐름**과 **구현 근거**를
분리해 적는다. 흐름에는 파일명을 넣지 않고, 구현 근거 표에서만 `경로/파일:F#` 으로 가리킨다.

상위 구조는 다음 두 문서를 본다.

| 문서 | 범위 |
| --- | --- |
| `docs/flow/map.pdf` | 계층(L) · 데이터(D) · 화면 여정(J) · 시스템(S) 배치도 |
| `docs/flow/phases.pdf` | 사용자 주요 흐름(P1–P15) · 기능/데이터 구조 · 인증/오류/독립 기능 |

---

## 읽는 법

### 도형

| 기호 | 뜻 |
| --- | --- |
| `◎` | 흐름 시작 · 종료 |
| `[ ]` | 처리 · 화면 단계 |
| `◇` | 분기 · 검사 조건 |
| `▷` | 외부 시스템 · 데이터 저장소 접근 |

### 연결

| 기호 | 뜻 |
| --- | --- |
| `↓` `→` | 실행 순서 · 데이터 전달 |
| `[true]` `[false]` | 조건 분기 결과 |
| `[반복]` | 반복 구간 |

### 참조

| 형식 | 뜻 |
| --- | --- |
| `경로/파일:F#` | 그 파일의 실행 흐름 주석 번호. **F 번호는 파일마다 1부터 다시 매긴다** |
| `F 미부여` | 코드에 `[F#]` 주석이 없는 위치. 번호를 임의로 만들지 않는다 |
| `확인 필요` | 코드에서 근거를 찾지 못한 위치 |

JSX 안에서는 `//` 가 주석이 아니라 화면에 출력되는 문자열이므로, 그 위치의 주석은
`{/* [F#] … */}` 형식으로 들어가 있다. 번호 규칙은 같다.

---

## ID 규칙

| 접두어 | 뜻 | 정의 위치 |
| --- | --- | --- |
| `FN01` – `FN13` | 기능 | 이 문서 |
| `P1` – `P15` | 사용자 단계 | `docs/flow/phases.pdf` |
| `D1-1` – `D4-7` | 데이터 저장 위치 | `docs/flow/map.pdf` 2장 |
| `L1` – `L6` | 계층 | `docs/flow/map.pdf` 1장 |
| `J1` – `J7` | 화면 여정 | `docs/flow/map.pdf` 3장 |
| `S1` – `S5` | 시스템 | `docs/flow/map.pdf` 4장 |

ID 는 변경하지 않는다. 기능 **이름**만 개발 문서 용어로 통일했다.

---

## 기능 목록

| ID | 기능 | 화면 | 주요 데이터 |
| --- | --- | --- | --- |
| FN01 | Gemini API Key 입력 | `/start` | D1-1 |
| FN02 | 로그인 · 회원가입 | `/login` `/signup` | D2-1 |
| FN03 | 음성 입력 레시피 생성 | `/pick` → `/shop` | D1-3 · D4-1 |
| FN04 | YouTube 링크 레시피 생성 | `/pick` → `/shop` | D1-3 · D4-1 · D4-5 |
| FN05 | 냉장고 재료 레시피 생성 | `/pick` → `/shop` | D1-3 · D4-1 |
| FN06 | 음성 기반 요리 진행 | `/cook` | D1-2 · D4-2 · D4-7 |
| FN07 | 게시글 작성 · 수정 · 삭제 | `/write` `/posts/[id]/edit` | D2-2 · D3-1 |
| FN08 | 댓글 | `/posts/[id]` | D2-5 · D1-5 |
| FN09 | 좋아요 · 즐겨찾기 | `/posts/[id]` | D2-3 · D2-4 |
| FN10 | 프로필 관리 | `/account` | D2-1 · D3-2 |
| FN11 | AI 요리 상담 (RAG) | `/ask` `/api/chat` | D1-6 · D2-6 · D2-7 · D4-3 · D4-4 |
| FN12 | 저장 레시피 관리 | `/shelf` | D1-4 · D1-3 |
| FN13 | 커뮤니티 목록 · 검색 · 태그 | `/community` | D2-2 · D2-1 · D3-1 |

---

# FN01  Gemini API Key 입력

| 항목 | 값 |
| --- | --- |
| 화면 | `/start` |
| 데이터 | D1-1 기록 · 조회 · 삭제 |
| 외부 시스템 | 없음 |
| 사용자 단계 | P2 |

### 흐름

```text
◎ API Key 입력 제출
      ↓
[입력값 정규화]  공백 제거
      ↓
◇ 공백 여부
   ├ [true]  → 오류 'empty' → [현재 화면에서 오류 메시지 표시]
   └ [false] ↓
▷ D1-1 기록
      ↓
◇ 기록 성공 여부
   ├ [false] → 오류 'storage' → [현재 화면에서 오류 메시지 표시]
   └ [true]  ↓
◎ 저장 완료 상태 표시 → /community 또는 /start/model
```

Key 가 필요한 기능은 저장소를 직접 읽지 않고 조회 함수를 거친다.

```text
[Key 필요 기능]  FN03 · FN04 · FN05 · FN06 · FN11 · FN13
      ↓
▷ D1-1 조회
      ↓
◇ Key 존재 여부
   ├ [false] → [오류 및 예외 처리 경로]  지도 C-3
   └ [true]  → [기능 진행]
```

### 구현 근거

| 단계 | 구현 위치 |
| --- | --- |
| API Key 입력 제출 | `components/start/api-key-form.tsx:F5` |
| 검증 호출 | `lib/usecase/enter-with-api-key.ts:F2` |
| 입력값 정규화 · 공백 여부 | `lib/domain/api-key.ts:F1` · `F2` · `F3` · `F4` |
| D1-1 기록 | `lib/usecase/enter-with-api-key.ts:F4` → `lib/adapter/browser-api-key-store.ts:F4` |
| 기록 성공 여부 | `lib/usecase/enter-with-api-key.ts:F5` · `F6` |
| D1-1 조회 | `lib/usecase/enter-with-api-key.ts:F7` |
| D1-1 삭제 | `lib/usecase/enter-with-api-key.ts:F8` · `components/start/api-key-form.tsx:F9` |
| 저장 상태 표시 분기 | `components/start/api-key-form.tsx:F10` |
| 저장소 키 이름 | `cookpilot.gemini-key` |

---

# FN02  로그인 · 회원가입

| 항목 | 값 |
| --- | --- |
| 화면 | `/login` `/signup` → `/start` |
| 데이터 | D2-1 profiles (가입 시 트리거가 생성) |
| 외부 시스템 | Supabase Auth |
| 사용자 단계 | P12 |

### 흐름 — 로그인

```text
◎ 로그인 폼 제출
      ↓
[폼 값 추출]  email · password
      ↓
[자격 증명 검증]
      ↓
◇ 검증 통과
   ├ [false] → 'email-empty' | 'email-shape' | 'password-empty'
   │            → [현재 화면에서 오류 메시지 표시 · 입력값 유지]
   └ [true]  ↓
▷ Supabase Auth 로그인 요청
      ↓
◇ 인증 성공
   ├ [false] → 메일 미확인 · 요청 과다 · 그 외로 분류
   │            → [현재 화면에서 오류 메시지 표시]
   └ [true]  ↓
▷ 라우트 캐시 무효화
      ↓
◎ /start 이동
```

검증에 실패하면 서버에 요청하지 않는다.

### 흐름 — 회원가입

```text
◎ 가입 폼 제출
      ↓
[표시 이름 검증]
      ↓
[자격 증명 검증]  로그인 검증 + 비밀번호 규칙
      ↓
◇ 검증 통과
   ├ [false] → 'password-short' | 'password-mismatch' 등
   │            → [현재 화면에서 오류 메시지 표시]
   └ [true]  ↓
▷ Supabase Auth 가입 요청
      ↓
▷ 트리거가 D2-1 profiles 행 생성
      ↓
◇ 메일 확인 필요 여부
   ├ [true]  → [메일 확인 안내 표시]  화면 이동 없음
   └ [false] → ◎ /start 이동
```

### 구현 근거

| 단계 | 구현 위치 |
| --- | --- |
| 로그인 폼 제출 | `components/login/login-form.tsx` → `app/actions/auth.ts:F2` |
| 폼 값 추출 | `app/actions/auth.ts:F1` · `F3` |
| 로그인 유스케이스 | `lib/usecase/sign-in.ts:F1` · `F2` |
| 자격 증명 검증 | `lib/domain/credentials.ts:F1` · `F3` · `F5` · `F6` · `F7` |
| 검증 통과 분기 | `lib/usecase/sign-in.ts:F3` |
| Supabase Auth 로그인 | `lib/adapter/supabase-auth-gateway.ts:F4` · `F5` · `F6` |
| 결과 반환 | `lib/usecase/sign-in.ts:F6` · `F7` |
| 캐시 무효화 · 이동 | `app/actions/auth.ts:F5` · `F6` · `F7` |
| 가입 폼 제출 | `components/signup/signup-form.tsx` → `app/actions/auth.ts:F8` |
| 표시 이름 검증 | `lib/usecase/sign-up.ts:F2` → `lib/domain/display-name.ts:F1` |
| 가입 자격 증명 검증 | `lib/usecase/sign-up.ts:F4` → `lib/domain/credentials.ts:F8` · `F11` · `F12` |
| Supabase Auth 가입 | `lib/usecase/sign-up.ts:F6` → `lib/adapter/supabase-auth-gateway.ts:F8` |
| profiles 행 생성 | `supabase/migrations/20260822120000_create_profiles.sql` (트리거) |
| 메일 확인 분기 · 이동 | `app/actions/auth.ts:F12` · `F13` |
| 로그아웃 | `app/actions/auth.ts:F14` → `lib/adapter/supabase-auth-gateway.ts:F11` |

---

# FN03  음성 입력 레시피 생성

| 항목 | 값 |
| --- | --- |
| 화면 | `/pick` → `/shop` |
| 데이터 | D1-1 조회 · D1-3 기록 |
| 외부 시스템 | D4-1 Gemini REST |
| 사용자 단계 | P4 |

### 흐름

```text
◎ 마이크 버튼 클릭
      ↓
▷ 마이크 열기  getUserMedia
      ↓
◇ 마이크 권한
   ├ [false] → 'denied' | 'missing' | 'failed'
   │            → [현재 화면에서 오류 메시지 표시]
   └ [true]  ↓
[반복] PCM 조각 수집 — 재클릭 시 종료
      ↓
[WAV base64 변환]
      ↓
◇ 음성 길이 하한  2000바이트
   ├ [false] → 'unheard' → [현재 화면에서 오류 메시지 표시]
   └ [true]  ↓
▷ D4-1 Gemini REST 호출  responseSchema 지정
      ↓
◇ HTTP 200
   ├ [false] → 'key' | 'too-many' | 'unreachable'
   └ [true]  ↓
[응답 JSON 파싱]
      ↓
◇ title 존재 여부
   ├ [false] → 'unheard'
   └ [true]  ↓
[Recipe 변환 · 검증]
   [반복] ingredients 유효 항목만 수집
   [반복] steps 유효 항목만 수집
      ↓
◇ 검증 통과
   ├ [false] → 'empty-ingredients' | 'empty-steps'
   └ [true]  ↓
▷ D1-3 기록
      ↓
◎ /shop 이동
```

### 구현 근거

| 단계 | 구현 위치 |
| --- | --- |
| 마이크 버튼 클릭 | `components/pick/voice-console.tsx:F6` |
| 마이크 열기 · 권한 분기 | `lib/adapter/browser-audio.ts:F2` · `F4` · `F5` |
| PCM 조각 수집 | `lib/adapter/browser-audio.ts:F8` · `F10` · `F12` |
| WAV base64 변환 | `lib/adapter/browser-audio.ts:F14` · `F17` |
| 음성 길이 하한 | `lib/usecase/plan-recipe.ts:F1` · `F2` |
| Gemini REST 호출 | `lib/usecase/plan-recipe.ts:F3` → `lib/adapter/gemini-recipe-gateway.ts:F18` · `F12` · `F5` · `F6` |
| HTTP 200 분기 | `lib/adapter/gemini-recipe-gateway.ts:F8` · `F2` |
| 응답 JSON 파싱 | `lib/adapter/gemini-recipe-gateway.ts:F9` · `F3` |
| title 존재 여부 | `lib/adapter/gemini-recipe-gateway.ts:F15` |
| Recipe 변환 · 검증 | `lib/domain/recipe.ts:F3` · `F9` · `F10` · `F12` · `F13` · `F14` · `F15` |
| D1-3 기록 | `lib/usecase/plan-recipe.ts:F14` · `F16` → `lib/adapter/browser-recipe-draft-store.ts:F3` |
| 결과 반환 · 이동 | `lib/usecase/plan-recipe.ts:F17` · `components/pick/voice-console.tsx:F18` |
| 저장소 키 이름 | `cookpilot.recipe-draft` |

---

# FN04  YouTube 링크 레시피 생성

| 항목 | 값 |
| --- | --- |
| 화면 | `/pick` → `/shop` |
| 데이터 | D1-3 기록 |
| 외부 시스템 | D4-1 Gemini REST · D4-5 i.ytimg.com |
| 사용자 단계 | P4 |

### 흐름

```text
◎ 영상 URL 입력 · 가져오기 클릭
      ↓
[URL 검증]
      ↓
◇ URL 형식
   ├ 공백         → 'empty'
   ├ 파싱 실패     → 'not-youtube'
   ├ 호스트 불일치  → 'not-youtube'
   │             → [현재 화면에서 오류 메시지 표시]
   └ [통과] ↓
▷ D4-1 Gemini REST 호출  fileData 로 영상 URL 전달
      ↓
[출처 정보 부착]  kind:'youtube' · channel · videoTitle · url
      ↓
▷ D1-3 기록
      ↓
◎ /shop 이동
      ↓
[영상 ID 추출]
      ↓
◇ 11자리 영상 ID
   ├ [false] → [썸네일 영역 미표시]
   └ [true]  ↓
▷ D4-5 썸네일 조회  i.ytimg.com/vi/<id>/mqdefault.jpg
      ↓
◎ 썸네일 · 영상 제목 · 채널 · 출처 안내 표시
```

URL 검증에 실패하면 모델을 호출하지 않는다. 존재하지 않는 영상의 내용을 생성하지 않기 위한 순서다.

### 구현 근거

| 단계 | 구현 위치 |
| --- | --- |
| URL 입력 · 실행 | `components/pick/pick-cards.tsx:F6` |
| URL 검증 · 형식 분기 | `lib/domain/recipe.ts:F22` · `F23` · `F25` · `F26` · `F27` |
| 검증 호출 · 조기 반환 | `lib/usecase/plan-recipe.ts:F8` · `F9` · `F10` |
| Gemini REST 호출 | `lib/usecase/plan-recipe.ts:F11` → `lib/adapter/gemini-recipe-gateway.ts:F20` |
| 출처 정보 부착 | `lib/adapter/gemini-recipe-gateway.ts:F17` |
| D1-3 기록 · 이동 | `lib/usecase/plan-recipe.ts:F14` · `components/pick/pick-cards.tsx:F8` |
| 영상 ID 추출 · 썸네일 URL | `lib/domain/recipe.ts:F30` → `lib/domain/recipe.ts:F28` |
| 출처 영역 렌더링 | `components/shop/youtube-source.tsx:F1` |

---

# FN05  냉장고 재료 레시피 생성

| 항목 | 값 |
| --- | --- |
| 화면 | `/pick` → `/shop` |
| 데이터 | D1-3 기록 (2단계에서만) |
| 외부 시스템 | D4-1 Gemini REST (2회 호출) |
| 사용자 단계 | P4 |

두 단계로 나뉜다. 1단계는 후보만 생성하고 아무것도 저장하지 않는다.

### 흐름 — 1단계 후보 생성

```text
◎ 보유 재료 입력 · 검색 클릭
      ↓
[재료 목록 파싱]  최대 20개
      ↓
◇ 재료 개수
   ├ 0개     → 'empty'
   ├ 1개     → 'too-few'
   │         → [현재 화면에서 오류 메시지 표시]
   └ 2개 이상 ↓
▷ D4-1 Gemini REST 호출  IDEAS_SCHEMA
      ↓
[후보 목록 파싱]
   [반복] title 유효 항목만 수집 — 5개 도달 시 종료
      ↓
◇ 후보 개수
   ├ 0개     → 'no-idea' → [현재 화면에서 오류 메시지 표시]
   └ 1개 이상 ↓
◎ 후보 카드 3~5개 표시   저장 없음
```

### 흐름 — 2단계 레시피 생성

```text
◎ 후보 카드 선택
      ↓
[재료 목록 재파싱]  1단계와 동일한 입력
      ↓
▷ D4-1 Gemini REST 호출  선택한 요리명 + 보유 재료
      ↓
[Recipe 변환 · 검증]  FN03 과 동일
      ↓
▷ D1-3 기록
      ↓
◎ /shop 이동
```

보유 재료를 2단계에 다시 전달한다. 요리명만 전달하면 보유하지 않은 재료로 레시피가 생성된다.

### 구현 근거

| 단계 | 구현 위치 |
| --- | --- |
| 재료 입력 · 실행 | `components/pick/pick-cards.tsx:F6` |
| 재료 목록 파싱 · 개수 분기 | `lib/domain/recipe.ts:F32` · `F33` · `F35` · `F36` |
| 1단계 유스케이스 | `lib/usecase/plan-recipe.ts:F12` |
| 후보 생성 호출 | `lib/adapter/gemini-recipe-gateway.ts:F21` · `F22` |
| 후보 목록 파싱 | `lib/adapter/gemini-recipe-gateway.ts:F24` → `lib/domain/recipe.ts:F37` |
| 후보 개수 분기 | `lib/adapter/gemini-recipe-gateway.ts:F25` |
| 후보 선택 | `components/pick/pick-cards.tsx:F13` |
| 2단계 유스케이스 | `lib/usecase/plan-recipe.ts:F13` |
| 레시피 생성 호출 | `lib/adapter/gemini-recipe-gateway.ts:F26` → `F12` |
| D1-3 기록 · 이동 | `lib/usecase/plan-recipe.ts:F14` · `components/pick/pick-cards.tsx:F15` |

---

# FN06  음성 기반 요리 진행

| 항목 | 값 |
| --- | --- |
| 화면 | `/cook` (설정은 `/start/model`) |
| 데이터 | D1-1 조회 · D1-2 조회 · D1-3 조회 |
| 외부 시스템 | D4-2 Gemini Live WebSocket · D4-7 speechSynthesis |
| 사용자 단계 | P6 |

세 갈래로 나눈다. 6-1 세션 연결, 6-2 음성 명령 처리, 6-3 조리 단계 낭독.

### 흐름 6-1 — 실시간 음성 세션 연결

```text
◎ /cook 진입   자동 실행
      ↓
▷ D1-1 조회
      ↓
◇ Key 존재 여부
   ├ [false] → [현재 화면에서 오류 메시지 표시]  세션 미연결
   └ [true]  ↓
▷ 마이크 열기
      ↓
▷ 스피커 열기
      ↓
▷ D4-2 WebSocket 연결
      ↓
[세션 설정 전송]  음성 모델 · 시스템 지시문 · 전사 활성화
      ↓
◇ setupComplete 수신
   ├ [false] → [대기]
   └ [true]  ↓
[반복] 마이크 PCM 조각 전송 — 화면 이탈 시 종료
```

음성 모델은 `voiceFor[gender][tone]` 표에서 결정한다. 6-3 도 같은 표를 참조한다.

### 흐름 6-2 — 음성 명령 처리

```text
◎ WebSocket 메시지 수신
      ↓
◇ 메시지 종류
   ├ interrupted        → [스피커 출력 중단]
   ├ inputTranscription → [텍스트 누적 · 0.7초 타이머 재설정] → [발화 확정]
   ├ modelTurn.parts    → [반복] 오디오 조각 전달
   └ turnComplete       → [응답 확정]
      ↓
[확정된 발화 텍스트]
      ↓
      ├──────────────────────────────┐
      ↓                              ↓
[조리 단계 명령 판정]            [타이머 요청 판정]
      ↓                              ↓
◇ 명령어 매칭                    ◇ 타이머 키워드 존재
   ├ 공백        → null             ├ [false] → null
   ├ 의문형 포함  → null             └ [true]  ↓
   ├ [반복] 접사 제거               [시 · 분 추출]
   ├ 8자 초과    → null                  ↓
   └ 매칭        ↓                 ◇ 1~1440분 범위
'next' | 'prev' | 'repeat'            ├ [false] → null
      ↓                               └ [true]  ↓
[단계 이동 또는 재낭독]            [타이머 등록]
```

의문형이 포함되면 단계 명령으로 판정하지 않는다. 질문 도중 화면이 이동하는 것을 막기 위한 조건이다.

### 흐름 6-3 — 조리 단계 낭독

```text
◎ 스피커 버튼 클릭
      ↓
[모델 지시문 생성]  note
[낭독 문자열 생성]  line
      ↓
◇ ① 실시간 세션 연결 상태
   ├ [true]  → ▷ 세션에 낭독 요청  같은 음성 모델
   └ [false] ↓
◇ ② D1-1 Key 존재 여부
   ├ [true]  → ▷ D4-2 임시 WebSocket 연결 → [설정 전송] → [문장 전송]
   │            → [반복] 오디오 조각 재생 → [연결 종료]
   │            ◇ 실패 → ③ 으로 이동
   └ [false] ↓
③ [브라우저 음성 합성]
      ↓
[음성 목록 조회]
   [반복] 한국어 음성만 필터
   [반복] 성별 힌트 이름 매칭
      ↓
◇ 성별 일치 음성 존재
   ├ [false] → [반대 성별 제외 후 선택] → [남성인 경우 pitch × 0.75]
   └ [true]  ↓
[말투별 rate · pitch 적용]
      ↓
▷ D4-7 speechSynthesis 출력
```

③ 은 최종 대비책이다. ①②③ 모두 같은 음성 설정값을 참조하므로 어느 경로로 출력해도
음성이 일치한다.

### 구현 근거

| 단계 | 구현 위치 |
| --- | --- |
| 세션 자동 연결 | `components/cook/live-console.tsx:F12` |
| D1-1 조회 · 분기 | `components/cook/live-console.tsx:F13` → `lib/usecase/enter-with-api-key.ts:F7` |
| 마이크 · 스피커 열기 | `components/cook/live-console.tsx:F14` · `F15` → `lib/adapter/browser-audio.ts:F2` · `F19` |
| WebSocket 연결 · 설정 전송 | `lib/adapter/gemini-live-gateway.ts:F2` · `F3` · `F6` |
| 시스템 지시문 생성 | `lib/usecase/cook-along.ts:F1` |
| setupComplete 분기 | `lib/adapter/gemini-live-gateway.ts:F8` |
| PCM 조각 전송 | `lib/adapter/gemini-live-gateway.ts:F16` · `components/cook/live-console.tsx:F18` |
| 메시지 종류 분기 | `lib/adapter/gemini-live-gateway.ts:F7` · `F9` · `F10` · `F11` · `F12` |
| 발화 · 응답 확정 | `lib/adapter/gemini-live-gateway.ts:F4` · `F5` |
| 발화 처리 진입 | `components/cook/live-console.tsx:F8` |
| 조리 단계 명령 판정 | `lib/domain/cook-progress.ts:F20` · `F22` · `F23` · `F24` · `F25` · `F26` · `F27` |
| 단계 이동 | `components/cook/live-console.tsx:F9` · `F10` → `lib/domain/cook-progress.ts:F1` |
| 타이머 요청 판정 | `lib/domain/cook-progress.ts:F10` · `F12` · `F13` · `F14` · `F16` · `F17` |
| 타이머 등록 | `components/cook/live-console.tsx:F11` → `components/cook/cook-shell.tsx:F9` |
| 스피커 버튼 | `components/cook/cook-shell.tsx:F14` |
| 지시문 · 낭독 문자열 생성 | `lib/usecase/cook-along.ts:F6` · `F5` |
| ① 세션 낭독 | `components/cook/cook-shell.tsx:F16` → `lib/adapter/gemini-live-gateway.ts:F17` |
| ② 임시 WebSocket 낭독 | `components/cook/cook-shell.tsx:F18` → `lib/adapter/gemini-live-gateway.ts:F19` · `F20` · `F22` · `F24` · `F25` · `F26` · `F27` · `F28` |
| ③ 브라우저 음성 합성 | `lib/adapter/browser-speech.ts:F8` · `F10` · `F11` · `F12` · `F13` |
| 음성 선택 | `lib/adapter/browser-speech.ts:F2` · `F4` · `F5` · `F6` |
| 음성 설정 저장 · 조회 | `lib/usecase/choose-cook-setup.ts:F1` · `F4` → `lib/adapter/browser-cook-setup-store.ts:F3` |
| 저장소 키 이름 | `cookpilot.cook-setup` |

---

# FN07  게시글 작성 · 수정 · 삭제

| 항목 | 값 |
| --- | --- |
| 화면 | `/cook/done` → `/write` · `/posts/[id]/edit` → `/posts/[id]` |
| 데이터 | D2-2 posts 기록 · D3-1 post-covers 기록 · D1-3 조회 |
| 외부 시스템 | Supabase · Supabase Storage |
| 사용자 단계 | P13 · 접근 권한 검사 J7 |

### 흐름 — 작성

```text
◎ /cook/done 에서 게시글 작성 선택
      ↓
▷ D1-3 조회
      ↓
[레시피 → 초안 변환]
   [반복] 재료 · 조리 순서를 본문으로 변환
   [반복] 제목 규칙 대조로 태그 추정
   [반복] 단계별 소요 시간 합산
      ↓
[폼 초기값 설정]
      ↓
◇ 표지 이미지 생성 여부
   ├ [false] → 다음 단계
   └ [true]  ↓
[Canvas 렌더링]
      → ▷ 인증 사용자 ID 조회
      → ▷ D3-1 업로드  <uuid>/<시각>.png
      → ▷ 공개 URL 조회
      → [숨은 입력값에 기록]
      ↓
◎ 게시 제출
      ↓
[초안 검증]
   ├ 제목 공백 · 80자 초과         → 'title-empty' | 'title-long'
   ├ 요약 300자 초과               → 'summary-long'
   ├ 본문 10자 미만 · 20000자 초과  → 'body-short' | 'body-long'
   ├ 태그 공백 · 12자 초과          → 'badge-empty' | 'badge-long'
   ├ 소요 시간 1~1440 벗어남        → 'minutes-range'
   └ 이미지 URL 이 자체 버킷 아님    → null 로 대체
      ↓
◇ 검증 통과
   ├ [false] → [현재 화면에서 오류 메시지 표시]
   └ [true]  ↓
▷ D2-2 INSERT   author_id · published 는 테이블 기본값
      ↓
▷ 게시 전환 RPC  set_post_published
      ↓
◇ 게시 전환 성공
   ├ [false] → 'rejected' → [현재 화면에서 오류 메시지 표시]
   └ [true]  ↓
▷ 목록 캐시 무효화
      ↓
◎ /posts/<id> 이동
```

게시 전환 실패를 무시하면 저장은 되었으나 목록에 노출되지 않는 행이 남는다.

### 흐름 — 수정

```text
◎ 수정 제출
      ↓
[초안 검증]  작성과 동일
      ↓
▷ D2-2 UPDATE + 영향 행 조회
      ↓
◇ 영향 행 수
   ├ 0      → 'rejected'  타 사용자 게시글
   └ 1 이상 ↓
◎ /posts/<id> 이동
```

### 흐름 — 삭제

```text
◎ 삭제 클릭
      ↓
◇ 확인 대화상자
   ├ [취소] → 종료
   └ [확인] ↓
▷ D2-2 DELETE
      ↓
[연관 행 CASCADE 삭제]  D2-3 · D2-4 · D2-5
      ↓
◎ /community 이동
```

### 구현 근거

| 단계 | 구현 위치 |
| --- | --- |
| 레시피 → 초안 변환 | `lib/domain/recipe-to-post.ts:F7` · `F4` · `F1` |
| 폼 초기값 설정 | `components/write/write-form.tsx:F8` · `F10` |
| Canvas 렌더링 | `components/write/write-form.tsx:F11` · `F12` · `F13` → `lib/recipe-card.ts:F1` |
| D3-1 업로드 | `components/write/write-form.tsx:F14` → `lib/adapter/browser-cover-upload.ts:F3` · `F4` · `F5` · `F6` · `F9` |
| 게시 제출 | `app/actions/post.ts:F2` |
| 게시 유스케이스 | `lib/usecase/write-post.ts:F1` · `F2` |
| 초안 검증 | `lib/domain/post-draft.ts:F3` · `F4` · `F5` · `F6` · `F7` · `F9` · `F10` · `F12` · `F13` |
| D2-2 INSERT · 게시 전환 | `lib/adapter/supabase-post-gateway.ts:F3` · `F5` · `F6` · `F7` |
| 캐시 무효화 · 이동 | `app/actions/post.ts:F4` · `F5` · `F6` |
| 수정 제출 | `app/actions/post.ts:F10` · `F11` → `lib/usecase/write-post.ts:F6` |
| D2-2 UPDATE · 영향 행 분기 | `lib/adapter/supabase-post-gateway.ts:F8` · `F10` |
| 수정 후 이동 | `app/actions/post.ts:F13` |
| 삭제 확인 · 실행 | `components/post/post-actions.tsx:F11` → `app/actions/post.ts:F14` |
| 삭제 유스케이스 | `lib/usecase/write-post.ts:F11` → `lib/adapter/supabase-post-gateway.ts:F11` |
| 삭제 후 이동 | `app/actions/post.ts:F16` |
| 접근 권한 검사 | `app/write/page.tsx:F4` · `app/posts/[id]/edit/page.tsx:F3` · `F6` |

---

# FN08  댓글

| 항목 | 값 |
| --- | --- |
| 화면 | `/posts/[id]` |
| 데이터 | D2-5 post_comments (게시글) · D1-5 comments (예시 글) |
| 외부 시스템 | Supabase |
| 사용자 단계 | P14 · 접근 권한 검사 J7 |

게시글과 예시 글의 저장 위치가 다르다.

### 흐름 — 작성

```text
◎ 댓글 폼 제출
      ↓
◇ 로그인 상태
   ├ [false] → [로그인 링크 표시]  폼 미노출
   └ [true]  ↓
[본문 검증]
      ↓
◇ 검증 통과
   ├ [false] → 'empty' | 'short' | 'long'
   │            → [현재 화면에서 오류 메시지 표시]
   └ [true]  ↓
▷ D2-5 INSERT   author_id 는 테이블 기본값
      ↓
[시도 번호 증가]  성공 시에도 상태가 바뀌어야 입력칸이 초기화된다
      ↓
▷ 글 화면 캐시 무효화
      ↓
◎ 댓글 목록 재조회
```

### 흐름 — 조회

```text
◎ 글 화면 렌더링
      ↓
▷ D2-5 SELECT  작성 시각 오름차순
      ↓
[반복] 행마다 표시용 값 계산
   ├ mine      = 조회자 ID == author_id
   ├ canRemove = mine 또는 조회자가 글 작성자
   ├ edited    = updated_at − created_at > 1초
   ├ avatar    → 프로필 이미지 URL 검증
   └ when      → 당일이면 'HH:MM', 아니면 'YYYY. MM. DD'
      ↓
◎ 댓글 목록 · 버튼 노출 여부 결정
```

권한 판정값은 서버가 계산해 전달한다. 화면이 이름 비교로 판정하면 동명이인에게 버튼이 노출된다.

### 흐름 — 수정 · 삭제

```text
◎ 수정 제출                       ◎ 삭제 클릭
      ↓                              ↓
[본문 검증]  작성과 동일           ▷ D2-5 DELETE + 영향 행 조회
      ↓                              ↓
▷ D2-5 UPDATE + 영향 행 조회      ◇ 영향 행 수
      ↓                              ├ 0      → 'rejected'
◇ 영향 행 수                         └ 1 이상 → ◎ 목록 재조회
   ├ 0      → 'rejected'  타 사용자 댓글
   └ 1 이상 → ◎ 목록 재조회
```

삭제 허용 대상은 댓글 작성자와 해당 게시글 작성자다. RLS 정책이 판정한다.

### 흐름 — 예시 글 댓글 (D1-5)

```text
◎ 예시 글 댓글 제출
      ↓
[본문 검증]  게시글 댓글과 동일
      ↓
▷ D1-5 기록
      ↓
◎ 목록 재렌더링   저장소 구독이 감지
```

### 구현 근거

| 단계 | 구현 위치 |
| --- | --- |
| 로그인 상태 분기 | `components/post/live-talk.tsx:F1` |
| 댓글 폼 제출 | `components/post/live-talk.tsx:F2` → `app/actions/post.ts:F17` |
| 작성 유스케이스 | `lib/usecase/discuss-post.ts:F11` · `F12` · `F13` · `F14` |
| 본문 검증 | `lib/domain/post.ts:F2` · `F4` · `F5` |
| D2-5 INSERT | `lib/adapter/supabase-comment-gateway.ts:F2` · `F5` |
| 시도 번호 증가 · 캐시 무효화 | `app/actions/post.ts:F19` · `F20` |
| 입력칸 초기화 | `components/post/live-talk.tsx:F5` |
| D2-5 조회 · 표시용 값 계산 | `lib/adapter/supabase-post-reader.ts:F14` · `F15` · `F16` · `F17` |
| 프로필 이미지 URL 검증 | `lib/domain/avatar.ts:F1` |
| 수정 제출 | `app/actions/post.ts:F21` → `lib/usecase/discuss-post.ts:F15` |
| D2-5 UPDATE · 영향 행 분기 | `lib/adapter/supabase-comment-gateway.ts:F8` · `F11` |
| 삭제 실행 | `components/post/live-talk.tsx:F11` → `app/actions/post.ts:F23` → `lib/usecase/discuss-post.ts:F19` |
| D2-5 DELETE | `lib/adapter/supabase-comment-gateway.ts:F12` |
| 예시 글 댓글 작성 | `components/post/post-talk.tsx:F4` · `F5` → `lib/usecase/discuss-post.ts:F1` |
| 예시 글 댓글 조회 | `components/post/post-talk.tsx:F3` → `lib/usecase/discuss-post.ts:F9` |
| 저장소 키 이름 | `cookpilot.comments` |

---

# FN09  좋아요 · 즐겨찾기

| 항목 | 값 |
| --- | --- |
| 화면 | `/posts/[id]` · `/community` |
| 데이터 | D2-3 post_likes · D2-4 post_bookmarks · D2-2 like_count |
| 외부 시스템 | Supabase |
| 사용자 단계 | P14 |

### 흐름 — 상태 변경

```text
◎ 좋아요 버튼 클릭
      ↓
◇ 로그인 상태
   ├ [false] → [현재 화면에서 오류 메시지 표시]
   └ [true]  ↓
[화면 상태 선반영]  onLike · count
      ↓
◇ 게시글 ID 형식  uuid
   ├ [false] → 'rejected'  예시 글
   └ [true]  ↓
◇ 다음 상태
   ├ [true]  → ▷ D2-3 INSERT
   │            ◇ 중복 키 23505 → 성공으로 처리
   └ [false] → ▷ D2-3 DELETE  본인 행만
      ↓
▷ 트리거가 D2-2 like_count 를 ±1
      ↓
◇ 요청 성공
   ├ [false] → [화면 상태 원복]
   └ [true]  → ▷ 목록 · 글 화면 캐시 무효화
```

다음 상태를 화면이 계산해 전달한다. 토글을 서버에 위임하면 연속 클릭 시 상태가 어긋난다.

즐겨찾기(D2-4)는 같은 구조이며, 타 사용자에게 노출되지 않고 집계하지 않는다.

### 흐름 — 초기 상태 조회

```text
◎ 글 화면 렌더링
      ↓
▷ D2-3 · D2-4 병렬 조회  Promise.all
      ↓
◎ { liked, saved } → 버튼 초기 상태
```

### 구현 근거

| 단계 | 구현 위치 |
| --- | --- |
| 로그인 상태 분기 | `components/post/post-actions.tsx:F5` |
| 좋아요 클릭 · 화면 선반영 | `components/post/post-actions.tsx:F4` · `F6` |
| 즐겨찾기 클릭 | `components/post/post-actions.tsx:F9` |
| 서버 액션 | `app/actions/post.ts:F25` · `F27` |
| ID 형식 판정 | `lib/usecase/react-to-post.ts:F1` · `F3` |
| 상태 변경 유스케이스 | `lib/usecase/react-to-post.ts:F2` · `F4` · `F5` |
| INSERT · DELETE · 중복 키 처리 | `lib/adapter/supabase-reaction-gateway.ts:F1` · `F3` · `F4` |
| like_count 트리거 | `supabase/migrations/20260824090000_likes_bookmarks_comments_avatars.sql` |
| 초기 상태 조회 | `app/posts/[id]/page.tsx:F9` → `lib/adapter/supabase-reaction-gateway.ts:F6` · `F8` |

---

# FN10  프로필 관리

| 항목 | 값 |
| --- | --- |
| 화면 | `/account` |
| 데이터 | D2-1 profiles · D3-2 avatars |
| 외부 시스템 | Supabase · Supabase Storage |
| 사용자 단계 | P15 · 접근 권한 검사 J7 |

### 흐름 — 프로필 이미지

```text
◎ 파일 선택
      ↓
▷ createImageBitmap
      ↓
◇ 이미지 디코딩 성공
   ├ [false] → 'not-image' → [현재 화면에서 오류 메시지 표시]
   └ [true]  ↓
[짧은 변 기준 정사각형 크롭] → [256px webp 변환]
      ↓
▷ 인증 사용자 ID 조회 → [경로 생성]  <uuid>/<시각>.webp
      ↓
▷ D3-2 업로드 → ▷ 공개 URL 조회
      ↓
[숨은 입력값 기록 → 폼 자동 제출]
      ↓
◇ URL 공백 여부  이미지 제거 요청
   ├ [true]  → ▷ D2-1 avatar_url = null
   └ [false] ↓
[URL 검증]  https 시작 + '/avatars/' 포함
      ↓
◇ 검증 통과
   ├ [false] → 'bad-url' → [현재 화면에서 오류 메시지 표시]
   └ [true]  ↓
▷ D2-1 UPDATE avatar_url
      ↓
▷ 목록 · 계정 화면 캐시 무효화
      ↓
◎ 게시글 · 댓글 · 홈 카드에 반영
      ↓
◇ 이미지 존재 여부
   ├ [false] → [표시 이름 첫 글자 렌더링]
   └ [true]  → [이미지 렌더링]
```

외부 도메인 URL 을 그대로 저장하면 해당 서버가 사용자 접속을 추적할 수 있다.
자체 버킷 경로만 통과시킨다.

### 흐름 — 표시 이름

```text
◎ 표시 이름 제출
      ↓
[표시 이름 검증]  회원가입과 동일 규칙
      ↓
◇ 검증 통과
   ├ [false] → [현재 화면에서 오류 메시지 표시]
   └ [true]  → ▷ D2-1 UPDATE display_name
```

### 구현 근거

| 단계 | 구현 위치 |
| --- | --- |
| 파일 선택 | `components/write/photo-form.tsx:F5` |
| 이미지 축소 · 크롭 | `lib/adapter/browser-avatar-upload.ts:F2` · `F3` · `F4` · `F5` |
| D3-2 업로드 · URL 조회 | `lib/adapter/browser-avatar-upload.ts:F6` · `F7` · `F8` · `F9` · `F10` |
| 폼 자동 제출 | `components/write/photo-form.tsx` (requestSubmit, F 미부여) |
| 서버 액션 | `app/actions/post.ts:F29` |
| 이미지 제거 · URL 검증 | `lib/usecase/rename-me.ts:F6` · `F7` · `F8` · `F9` · `F10` |
| URL 허용 규칙 | `lib/domain/avatar.ts:F1` · `F2` · `F5` · `F6` |
| D2-1 UPDATE | `lib/adapter/supabase-profile-gateway.ts:F1` · `F6` |
| 대체 문자 렌더링 | `lib/domain/avatar.ts:F7` |
| 표시 이름 변경 | `app/actions/post.ts:F7` → `lib/usecase/rename-me.ts:F1` · `F2` · `F3` · `F4` · `F5` |
| 접근 권한 검사 | `app/account/page.tsx:F3` |

---

# FN11  AI 요리 상담 (RAG)

| 항목 | 값 |
| --- | --- |
| 화면 | `/ask` · `/api/chat` · `/api/chat/[id]` · `/api/kitchen/index` |
| 데이터 | D1-6 chat-id · D2-6 chats · D2-7 messages |
| 외부 시스템 | D4-3 Gemini (서버) · D4-4 Pinecone |
| 사용자 단계 | P9 |

브라우저가 Key 를 서버로 전달하는 유일한 기능이다. Pinecone Key 가 서버에만 있어
검색을 서버가 수행한다.

### 흐름 — 질문 · 응답

```text
◎ 질문 제출
      ↓
▷ POST /api/chat   질문 + 대화 이력 + D1-1 Key
      ↓
[질문 검증]
      ↓
◇ 검증 통과
   ├ [false] → 'empty' | 'short' | 'long'
   │            → [현재 화면에서 오류 메시지 표시]
   └ [true]  ↓
◇ D1-6 대화 ID 존재
   ├ [true]  → 기존 ID 사용
   └ [false] → ▷ D2-6 INSERT → 신규 ID
      ↓
▷ D2-7 INSERT  role:'user'
      ↓
[대화 이력 절삭]  최근 6턴
      ↓
◇ RAG 설정 완비
   ├ [false] → 'key' → [현재 화면에서 오류 메시지 표시]
   └ [true]  ↓
▷ D4-4 Pinecone 유사도 검색  k=5
      ↓
▷ D4-3 Gemini 응답 생성
      ↓
◇ 검색 결과 0건
   ├ [true]  → 'no-hits'
   └ [false] ↓
◇ 응답 본문 공백  안전 필터
   ├ [true]  → 'no-hits'
   └ [false] ↓
[출처 목록 정리]
   [반복] 동일 dishId 중복 제거
      ↓
▷ D2-7 INSERT  role:'assistant'
      ↓
◎ 응답 본문 + 출처 목록 표시   화면 이동 없음
```

질문은 응답 실패와 무관하게 먼저 기록한다.

### 흐름 — 후기 데이터 색인 (운영 작업)

```text
◎ POST /api/kitchen/index
      ↓
▷ samples/reviews.csv 읽기
      ↓
[반복] 행마다 Review 변환
   ├ id · content 공백 → 건너뜀
   ├ dish 공백        → 건너뜀
   └ 유효             → 수집
      ↓
[반복] 후기마다 검색 대상 문자열 생성
      ↓
[반복] 80건 단위로 분할
      ↓
▷ D4-4 Pinecone 업로드
      ↓
◎ { count } 반환
```

한 번에 전량 전송하면 임베딩 모델이 건수 제한으로 거절한다.
이 작업은 FN11 질의 이전에 1회 실행해야 한다.

### 구현 근거

| 단계 | 구현 위치 |
| --- | --- |
| 질문 제출 | `components/ask/ask-shell.tsx:F8` |
| 라우트 핸들러 | `app/api/chat/route.ts:F4` |
| 상담 유스케이스 | `lib/usecase/ask-kitchen.ts:F1` · `F2` · `F3` |
| 질문 검증 | `lib/domain/ask.ts:F1` · `F3` · `F4` |
| 대화 ID 분기 · 생성 | `lib/usecase/ask-kitchen.ts:F4` · `F5` → `lib/adapter/supabase-chat-log.ts:F5` |
| D1-6 저장 · 조회 · 삭제 | `lib/usecase/ask-kitchen.ts:F13` · `F12` · `F14` · `components/ask/ask-shell.tsx:F18` |
| 메시지 기록 | `lib/usecase/ask-kitchen.ts:F6` · `F10` → `lib/adapter/supabase-chat-log.ts:F6` |
| 대화 이력 절삭 | `lib/usecase/ask-kitchen.ts:F7` → `lib/domain/ask.ts:F5` |
| RAG 설정 · 실행 | `lib/adapter/langchain-rag.ts:F2` · `F21` · `F22` · `F23` · `F24` · `F27` |
| Pinecone 검색 | `lib/adapter/langchain-rag.ts:F28` |
| Gemini 응답 생성 | `lib/adapter/langchain-rag.ts:F29` |
| 검색 결과 · 본문 분기 | `lib/adapter/langchain-rag.ts:F30` · `F31` |
| 출처 목록 정리 | `lib/adapter/langchain-rag.ts:F32` · `F19` → `lib/domain/ask.ts:F7` |
| 대화 조회 | `app/api/chat/[id]/route.ts:F1` · `F3` → `lib/adapter/supabase-chat-log.ts:F7` |
| 색인 라우트 | `app/api/kitchen/index/route.ts:F1` |
| CSV 로드 · 행 변환 | `lib/adapter/csv-reviews.ts:F4` · `F5` · `F6` · `F1` · `F7` |
| Review 검증 | `lib/domain/review.ts:F3` · `F5` · `F6` · `F7` |
| 검색 대상 문자열 생성 | `lib/domain/review.ts:F9` |
| 색인 업로드 | `lib/adapter/langchain-rag.ts:F10` · `F12` · `F13` · `F14` |
| 색인 점검 조회 | `app/api/kitchen/index/route.ts:F6` · `lib/adapter/langchain-rag.ts:F17` |
| 저장소 키 이름 | `cookpilot.chat-id` |

---

# FN12  저장 레시피 관리

| 항목 | 값 |
| --- | --- |
| 화면 | `/shelf` · `/cook/done` |
| 데이터 | D1-4 recipe-shelf · D1-3 recipe-draft |
| 외부 시스템 | 파일 다운로드 · 업로드 (백업) |
| 사용자 단계 | P7 · P10 |

### 흐름 — 저장

```text
◎ 요리 완료 화면에서 저장 선택
      ↓
▷ D1-4 조회
      ↓
[반복] 동일 제목 항목 제외
      ↓
▷ D1-4 기록  신규 항목을 선두에 배치
      ↓
◎ { count } 반환
```

동일 제목을 다시 저장하면 기존 항목을 대체한다.

### 흐름 — 조회 · 재사용

```text
◎ 표지 클릭
      ↓
[Recipe 변환 · 검증]
      ↓
◇ 레시피 데이터 포함 여부
   ├ [false] → [항목 비활성화]  레시피 미포함 구버전 항목
   └ [true]  ↓
▷ D1-3 기록  출처를 'shelf' 로 지정
      ↓
◎ /shop 이동   P5 장보기 목록 확인으로 합류
```

### 흐름 — 삭제

```text
◎ 항목 삭제 클릭
      ↓
◇ 확인 대화상자
   ├ [취소] → 종료
   └ [확인] ↓
[반복] 해당 ID 제외
      ↓
▷ D1-4 기록
```

### 흐름 — 백업

```text
◎ 백업 내보내기                    ◎ 백업 가져오기
      ↓                               ↓
▷ D1-4 조회                        ▷ 파일 읽기
      ↓                               ↓
[JSON 직렬화]                      [JSON 역직렬화 · 검증]
      ↓                               ↓
▷ 파일 저장                        ◇ 검증 통과
                                      ├ JSON 형식 오류         → 'broken'
                                      ├ 버전 불일치            → 'version'
                                      ├ [반복] 항목 구조 불일치  → 'shape'
                                      │         → [D1-4 미변경]
                                      └ [true] → ▷ D1-4 전체 교체
```

검증에 실패하면 기존 저장 항목을 변경하지 않는다.

### 구현 근거

| 단계 | 구현 위치 |
| --- | --- |
| 저장 실행 | `components/cook/done-shell.tsx:F8` → `lib/usecase/keep-recipe-shelf.ts:F7` |
| 중복 제외 · 기록 | `lib/usecase/keep-recipe-shelf.ts:F8` · `F9` · `F10` · `F11` |
| 목록 조회 · 개수 | `lib/usecase/keep-recipe-shelf.ts:F1` · `F2` · `F3` |
| 화면 목록 구독 | `components/shelf/shelf-stand.tsx:F3` · `F4` |
| 재사용 · Recipe 검증 | `components/shelf/shelf-stand.tsx:F6` · `F7` → `lib/domain/recipe.ts:F3` |
| 항목 비활성화 판정 | `components/shelf/shelf-stand.tsx:F2` (JSX, 개별 F 미부여) |
| 빈 목록 분기 | `components/shelf/shelf-stand.tsx:F11` |
| 항목 삭제 | `components/shelf/shelf-stand.tsx:F8` · `F9` · `F10` → `lib/usecase/keep-recipe-shelf.ts:F12` · `F14` · `F15` |
| 전체 삭제 | `components/pick/pick-rail.tsx:F12` → `lib/usecase/keep-recipe-shelf.ts:F4` |
| 백업 내보내기 | `lib/usecase/keep-recipe-shelf.ts:F5` · `F6` → `lib/domain/recipe-shelf.ts:F2` |
| 백업 가져오기 · 검증 | `lib/usecase/keep-recipe-shelf.ts:F16` · `F17` · `F18` → `lib/domain/recipe-shelf.ts:F5` · `F7` · `F9` · `F11` · `F12` |
| 저장소 키 이름 | `cookpilot.recipe-shelf` |

---

# FN13  커뮤니티 목록 · 검색 · 태그

| 항목 | 값 |
| --- | --- |
| 화면 | `/community` → `/posts/[id]` |
| 데이터 | D2-2 posts 조회 · D2-1 profiles 조인 · D3-1 표지 조회 |
| 외부 시스템 | Supabase |
| 사용자 단계 | P11 |

### 흐름

```text
◎ /community?tab=…&q=… 진입
      ↓
[탭 값 정규화]
   ├ 배열이면 마지막 값
   ├ 미지정이면 기본 탭
   └ 미등록 값이면 기본 탭
      ↓
[검색어 정규화]  공백 제거 · 60자 절삭
      ↓
▷ D2-2 SELECT + D2-1 조인  게시 상태 · 최신순
      ↓
◇ 컬럼 미존재 오류  42703 · PGRST200
   ├ [true]  → ▷ 해당 컬럼 제외 후 재조회
   └ [false] ↓
◇ 조회 성공
   ├ [false] → [빈 배열]  예시 글만 표시
   └ [true]  ↓
[반복] 행마다 표시용 값 계산
   ├ mine       = 조회자 ID == author_id
   └ chefAvatar → 프로필 이미지 URL 검증
      ↓
◇ 검색어 존재
   ├ [true]  → [제목 · 작성자 · 태그 · 요약 대조]
   │            [반복] 한 필드라도 일치하면 통과
   └ [false] → [탭 조건으로 필터]
      ↓
[예시 글 이미지 경로 생성]
      ↓
◇ 이미지 존재 여부
   ├ [false] → [이미지 영역 미생성]
   └ [true]  → [이미지 렌더링]
      ↓
◎ 목록 렌더링
      ↓
[태그 클릭] → ◎ /community?q=<태그>   검색과 동일 경로
```

컬럼 미존재 재조회는 마이그레이션 미적용 상태에서도 목록이 비지 않게 하는 장치다.
PostgREST 는 컬럼 하나가 없으면 쿼리 전체를 거절한다.

이미지 경로가 없을 때 영역을 생성하지 않는 것은, 존재하지 않는 파일을 요청해
목록 전체가 깨지는 것을 막기 위한 조건이다.

### 구현 근거

| 단계 | 구현 위치 |
| --- | --- |
| 라우트 진입 | `app/community/page.tsx:F1` |
| 탭 값 정규화 | `lib/domain/community-tab.ts:F1` · `F2` · `F3` · `F4` |
| 검색어 정규화 | `lib/domain/community-tab.ts:F5` · `F7` |
| D2-2 조회 · 조인 | `lib/adapter/supabase-post-reader.ts:F6` · `F7` |
| 컬럼 미존재 재조회 | `lib/adapter/supabase-post-reader.ts:F8` |
| 조회 실패 분기 | `lib/adapter/supabase-post-reader.ts:F9` |
| 표시용 값 계산 | `lib/adapter/supabase-post-reader.ts:F1` · `F10` |
| 프로필 이미지 URL 검증 | `lib/domain/avatar.ts:F1` |
| 검색어 대조 | `lib/domain/community-tab.ts:F8` · `F9` · `F10` · `F11` · `F12` |
| 예시 글 이미지 경로 | `lib/domain/post.ts:F1` |
| 카드 렌더링 · 이미지 분기 | `components/community/post-cards.tsx:F1` |
| 태그 링크 | `components/community/tag-link.tsx` |
| 글 상세 조회 | `lib/adapter/supabase-post-reader.ts:F11` |
| 예시 글 상세 조회 | `lib/domain/post.ts:F6` |

---

# 부록 A — 계층 간 규칙

이 문서 전체에 적용되는 규칙 넷이다.

| 규칙 | 내용 |
| --- | --- |
| **검증은 도메인 계층에서 단일 구현** | 화면에서 걸렀더라도 서버에서 같은 함수를 다시 호출한다. `checkComment` · `readPostDraft` · `checkDisplayName` 등. 두 벌로 두면 한쪽만 수정된다. |
| **외부 의존은 인터페이스로 역전** | 유스케이스는 `Gateway` · `Store` 인터페이스만 참조한다. Supabase · Gemini · localStorage 라는 구체 이름은 어댑터 계층에만 존재한다. |
| **권한 판정은 RLS, 화면은 boolean 만 사용** | `mine` · `canRemove` 를 화면이 이름 비교로 계산하면 동명이인에게 버튼이 노출된다. |
| **실패는 오류 코드로 전달** | 유스케이스는 코드만 반환하고, 표시 문구 선택은 화면 계층(`lib/*-content.ts`)이 담당한다. |

---

# 부록 B — 화면 계층에서 흐름을 읽는 법

화면 파일(L6)은 대체로 같은 구조를 쓴다. `[F#]` 주석이 아래 위치에 붙는다.

| 위치 | 내용 | 예 |
| --- | --- | --- |
| `[F1][함수]` | 컴포넌트 정의. 입력(props) · 처리 · 출력(JSX) | 모든 화면 파일 |
| `[흐름]` | `useState` 로 보유하는 값 | `components/pick/pick-cards.tsx:F3` |
| `[외부]` | `useSyncExternalStore` 로 저장소를 구독하는 위치 | `components/community/home-me.tsx:F3` · `F4` · `F5` |
| `[함수]` | 이벤트 핸들러 | `components/pick/voice-console.tsx:F6` · `F12` |
| `[분기]` | 화면이 갈라지는 조건 | `components/shop/shop-shell.tsx:F8` |
| `[반복]` | 목록 렌더링 `.map()` | `components/community/post-cards.tsx:F1` |

화면 계층에서 외부로 나가는 경로는 셋뿐이다.

| 경로 | 방식 | 사용 기능 |
| --- | --- | --- |
| **서버 액션** | `useActionState` 또는 `startTransition` → `app/actions/*` → 유스케이스 → 어댑터 | FN02 · FN07 · FN08 · FN09 · FN10 |
| **브라우저 저장소** | `browser*Store` 를 사용하는 유스케이스 | FN01 · FN06 · FN12 |
| **외부 API 직접 호출** | Gemini · Supabase Storage. Key 가 브라우저에만 있어 서버를 거치지 않는다 | FN03 · FN04 · FN05 · FN06 · FN07 · FN10 |

외부 API 직접 호출 위치: `components/pick/voice-console.tsx:F16` ·
`components/cook/live-console.tsx:F16` · `components/write/photo-form.tsx:F8` ·
`components/write/write-form.tsx:F14`

세 경로 모두 화면 계층이 비즈니스 규칙을 직접 보유하지 않는다. 검증은 도메인,
순서는 유스케이스, 외부 통신 방식은 어댑터가 담당한다.
