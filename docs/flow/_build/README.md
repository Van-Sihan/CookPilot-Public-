# 전체 흐름 지도를 다시 뽑는 법

`docs/flow/map.html` 과 `docs/flow/map.pdf` 는 손으로 고치지 않는다.
여기 세 파일이 원본이다.

| 파일 | 하는 일 |
| --- | --- |
| `chart.py` | 기본 플로차트 도형(단말·처리·분기·평행사변형·원통·이음표)을 SVG 로 그리는 엔진 |
| `charts.py` | 3장 여정 지도 두 장과 4장 시스템 그림을 좌표로 짠다 |
| `build.py` | 표와 글을 붙여 `docs/flow/map.html` 을 쓴다 |
| `service.py` | 지도 A · B · C 를 좌표로 짠다 |
| `build3.py` | 지도 A · B · C 와 구현 근거를 붙여 `docs/flow/phases.html` 을 쓴다 |

```
python build.py                     # → docs/flow/map.html    (전체 흐름 지도, 15쪽)
python build3.py                    # → docs/flow/phases.html (서비스 흐름도, 7쪽)
```

## 표기 규칙

- 상자 안에는 짧은 명사구만 넣는다. 설명은 상자 밖 주석이나 리드 문단으로 뺀다.
- 파일 경로와 `F#` 은 지도에 넣지 않는다. 구현 근거 표에만 적는다.
- ID(`P` · `FN` · `D` · `L` · `J` · `S`)는 새로 만들지 않는다.
  기존 `docs/flow/map.pdf` · `docs/flow/flow.md` 의 것을 그대로 쓴다.

PDF 는 브라우저 인쇄로 만든다. `map.html` 안에 `@page { size: A4 landscape }`
가 들어 있으므로 인쇄 설정에서 "용지 크기: 원본 설정" 을 고르면 그대로 나온다.
헤드리스 크롬으로 뽑으려면 `Page.printToPDF` 에 `preferCSSPageSize: true` 를 준다.

## 왜 SVG 로 그리나

화살표와 마름모를 CSS(`clip-path`, `::after` 삼각형)로 만들면 인쇄할 때
자리가 어긋나거나 화살촉이 사라진다. SVG 는 `<marker>` 로 화살촉을 붙이므로
PDF 에서도 벡터 그대로 남는다.

## 고정폭 글꼴에 한글을 꼭 붙일 것

`font-family` 를 `Consolas, monospace` 로만 두면 한글이 두부(□)로 나온다.
Consolas 에 한글 글리프가 없고 대체할 곳이 없기 때문이다. `chart.py` 의
`MONO` 에 `'Malgun Gothic'` 이 들어 있는 까닭이다.
