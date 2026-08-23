# 유스케이스 다이어그램을 다시 뽑는 법

`docs/usecase/CookPilot_UseCase_Diagram.svg` · `.png` · `usecase.md` 는
손으로 고치지 않는다. `make_usecase.py` 하나가 셋을 다 만든다.

```
python make_usecase.py
```

SVG · Mermaid · 매핑표가 **같은 데이터 하나(`MODULES`)** 에서 나오므로
셋이 어긋날 수 없다. 유스케이스를 고치려면 그 표만 고친다.

PNG 는 크롬으로 굽는다. pymupdf 는 `marker`(화살촉)와 `stroke-dasharray`
(점선)를 그리지 않아 include · extend · 일반화가 실선으로 나온다.

## 도형 규칙 (UML)

| 기호 | 뜻 |
| --- | --- |
| 졸라맨 | 행위자 |
| 타원 | 유스케이스 |
| 굵은 사각형 | 시스템 경계 |
| 점선 사각형 | 모듈 (M1–M7) |
| 실선 | 연관 |
| 점선 화살표 | `<<include>>` · `<<extend>>` |
| 빈 삼각형 | 일반화 |

## 넣지 않는 것

함수명 · 변수명 · F# · 파일 경로 · DB 테이블 · localStorage 키 ·
API 엔드포인트는 다이어그램에 넣지 않는다. 그 정보는
`docs/spec/CookPilot_기능명세서_HIPO.xlsx` 와 `docs/flow/flow.md` 가 갖고 있고,
`usecase.md` 의 매핑표가 둘을 잇는다.

## 도형 엔진

`docs/flow/_build/chart.py` 를 가져다 쓴다(`UcChart` 가 상속). 흐름도와
유스케이스가 같은 엔진을 쓰므로 선 굵기와 글꼴이 일관된다.
