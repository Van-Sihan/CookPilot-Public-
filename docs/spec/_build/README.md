# 기능명세서 · HIPO 엑셀을 다시 뽑는 법

`docs/spec/CookPilot_기능명세서_HIPO.xlsx` 는 손으로 고치지 않는다.
여기 네 파일이 원본이다.

| 파일 | 담는 것 |
| --- | --- |
| `hipo_data.py` | 시스템(S1) · 모듈(M1–M7) · 기능(FN01–FN13) |
| `hipo_funcs.py` | 함수 IPO 121건 (FUNC001–FUNC121) |
| `hipo_tables.py` | 기능 체크리스트 61건 · 데이터 사전 22건 · 화면 여정 17건 |
| `make_xlsx.py` | 위 셋을 붙여 7개 시트를 만든다 |

```
python make_xlsx.py        # → docs/spec/CookPilot_기능명세서_HIPO.xlsx
```

## ID 규칙

ID 는 새로 만들지 않는다. 기존 문서의 것을 그대로 쓴다.

| 접두어 | 뜻 | 정의 위치 |
| --- | --- | --- |
| `FN01` – `FN13` | 기능 | `docs/flow/flow.md` |
| `D1-1` – `D4-7` | 데이터 저장 위치 | `docs/flow/map.pdf` 2장 |
| `L1` – `L6` | 계층 | `docs/flow/map.pdf` 1장 |
| `J1` – `J7` | 화면 여정 | `docs/flow/map.pdf` 3장 |
| `S1` – `S5` | 시스템 | `docs/flow/map.pdf` 4장 |
| `P1` – `P15` | 사용자 단계 | `docs/flow/phases.pdf` |
| `M1` – `M7` | 모듈 | 이 문서에서 새로 부여 |
| `C1` – `C61` | 기능 체크 항목 | 이 문서에서 새로 부여 |
| `FUNC001` – `FUNC121` | 함수 | 이 문서에서 새로 부여 |

## 표기 규칙

- 구현위치: `경로/파일명.ts :: 함수() :F#`
- 근거: `경로/파일명.ts:F#`
- 함수명 칸에 파일명을 섞지 않는다.
- `Process` 대신 `처리` 를 쓴다.
- 코드에서 근거를 찾지 못하면 `확인 필요` 로 적는다. 추론하지 않는다.

## 고칠 때

기능이나 함수가 바뀌면 위 세 데이터 파일을 고치고 `make_xlsx.py` 를 다시 돌린다.
돌린 뒤에는 `파일:F#` 참조가 코드의 `[F#]` 주석과 맞는지 확인한다.
