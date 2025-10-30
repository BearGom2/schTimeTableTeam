import { useMemo, useState } from "react";

type Day = "월" | "화" | "수" | "목" | "금";

type Course = {
  id: string;
  name: string;
  day: Day;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  building: string; // "M"
  room: string; // "502"
};

// 색상: 사용자가 정의한 규칙
const COLOR_ADDED = "#103F6E"; // 내가 넣은 강의
const COLOR_RECOMMENDED = "#DBF4FC"; // 추천 강의

// 예시 강의 데이터 (필요 시 확장 가능)
const SAMPLE_COURSES: Course[] = [
  // 월(M 중심 + RC 섞음)
  {
    id: "c1",
    name: "C프로그래밍",
    day: "월",
    start: "13:30",
    end: "15:00",
    building: "M",
    room: "502",
  },
  {
    id: "c7",
    name: "알고리즘",
    day: "월",
    start: "15:00",
    end: "16:30",
    building: "M",
    room: "503",
  },
  {
    id: "c8",
    name: "이산수학",
    day: "월",
    start: "11:00",
    end: "12:30",
    building: "M",
    room: "501",
  },
  {
    id: "c11",
    name: "운영체제",
    day: "월",
    start: "09:00",
    end: "10:30",
    building: "M",
    room: "504",
  },
  {
    id: "c12",
    name: "영어회화(초급)",
    day: "월",
    start: "10:30",
    end: "12:00",
    building: "RC",
    room: "210",
  },

  // 화(RC 중심 + M 섞음)
  {
    id: "c2",
    name: "현대실용영어",
    day: "화",
    start: "10:00",
    end: "11:30",
    building: "RC",
    room: "220",
  },
  {
    id: "c9",
    name: "자료구조",
    day: "화",
    start: "11:30",
    end: "13:00",
    building: "M",
    room: "502",
  },
  {
    id: "c13",
    name: "영작문",
    day: "화",
    start: "13:00",
    end: "14:30",
    building: "RC",
    room: "230",
  },
  {
    id: "c14",
    name: "컴퓨터네트워크",
    day: "화",
    start: "15:00",
    end: "16:30",
    building: "M",
    room: "505",
  },

  // 수(M 중심)
  {
    id: "c3",
    name: "오픈SW활용",
    day: "수",
    start: "09:00",
    end: "10:30",
    building: "M",
    room: "502",
  },
  {
    id: "c4",
    name: "확률과통계",
    day: "수",
    start: "11:30",
    end: "13:00",
    building: "M",
    room: "502",
  },
  {
    id: "c15",
    name: "데이터베이스",
    day: "수",
    start: "13:00",
    end: "14:30",
    building: "M",
    room: "506",
  },
  {
    id: "c16",
    name: "일본어회화",
    day: "수",
    start: "14:30",
    end: "16:00",
    building: "RC",
    room: "235",
  },

  // 목(혼합)
  {
    id: "c10",
    name: "컴퓨터개론",
    day: "목",
    start: "13:00",
    end: "14:30",
    building: "M",
    room: "501",
  },
  {
    id: "c17",
    name: "중국어입문",
    day: "목",
    start: "10:30",
    end: "12:00",
    building: "RC",
    room: "215",
  },
  {
    id: "c18",
    name: "선형대수",
    day: "목",
    start: "09:00",
    end: "10:30",
    building: "M",
    room: "507",
  },

  // 금(M 중심)
  {
    id: "c5",
    name: "창의소프트웨어설계",
    day: "금",
    start: "10:00",
    end: "11:30",
    building: "M",
    room: "503",
  },
  {
    id: "c6",
    name: "C프로그래밍 실습",
    day: "금",
    start: "12:00",
    end: "13:30",
    building: "M",
    room: "518",
  },
  {
    id: "c19",
    name: "영어프레젠테이션",
    day: "금",
    start: "09:00",
    end: "10:00",
    building: "RC",
    room: "205",
  },
  {
    id: "c20",
    name: "캡스톤디자인",
    day: "금",
    start: "14:00",
    end: "16:00",
    building: "M",
    room: "520",
  },
];

const DAYS: Day[] = ["월", "화", "수", "목", "금"];

// 시간 헬퍼
function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function isOverlap(a: Course, b: Course) {
  if (a.day !== b.day) return false;
  const as = toMinutes(a.start);
  const ae = toMinutes(a.end);
  const bs = toMinutes(b.start);
  const be = toMinutes(b.end);
  return as < be && bs < ae; // 겹침 조건
}

function isAdjacent(a: Course, b: Course) {
  if (a.day !== b.day) return false;
  const ae = toMinutes(a.end);
  const bs = toMinutes(b.start);
  const be = toMinutes(b.end);
  const as = toMinutes(a.start);
  // 앞뒤로 딱 붙는 경우 우선
  return ae === bs || be === as;
}

// 추천 로직: 동일 건물 우선 -> 인접 시간 우선 -> 겹치지 않음 필수
function recommendAfterAdd(
  added: Course,
  all: Course[],
  selected: Set<string>
): string[] {
  // 같은 요일만 후보로 제한
  const candidates = all.filter(
    (c) => !selected.has(c.id) && c.id !== added.id && c.day === added.day
  );

  // 겹치면 제외
  const nonOverlap = candidates.filter((c) => !isOverlap(c, added));

  // 동일 건물 우선
  const sameBuilding = nonOverlap.filter((c) => c.building === added.building);
  const others = nonOverlap.filter((c) => c.building !== added.building);

  // 인접 시간 우선 정렬 함수
  const byAdjacencyThenGap = (base: Course) => (x: Course, y: Course) => {
    const xAdj = isAdjacent(base, x) ? 0 : 1;
    const yAdj = isAdjacent(base, y) ? 0 : 1;
    if (xAdj !== yAdj) return xAdj - yAdj;
    // 인접이 아닌 경우: base와의 시간 간격이 더 작은 순
    const baseEnd = toMinutes(base.end);
    const baseStart = toMinutes(base.start);
    const xGap = Math.min(
      Math.abs(toMinutes(x.start) - baseEnd),
      Math.abs(toMinutes(x.end) - baseStart)
    );
    const yGap = Math.min(
      Math.abs(toMinutes(y.start) - baseEnd),
      Math.abs(toMinutes(y.end) - baseStart)
    );
    return xGap - yGap;
  };

  const sortedSame = sameBuilding.sort(byAdjacencyThenGap(added));
  const sortedOthers = others.sort(byAdjacencyThenGap(added));

  // 상위 몇 개만 제안 (너무 많지 않게)
  return [...sortedSame, ...sortedOthers].slice(0, 3).map((c) => c.id);
}

function blockTop(start: string) {
  // 09:00을 0으로 두고 30분당 1블록, 블록 높이 24px
  const base = toMinutes("09:00");
  const diff = toMinutes(start) - base;
  return Math.max(0, Math.round(diff / 30)) * 24; // px
}

function blockHeight(start: string, end: string) {
  const diff = toMinutes(end) - toMinutes(start);
  return Math.max(24, Math.round(diff / 30) * 24);
}

export default function ScheduleAddPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [recommended, setRecommended] = useState<Set<string>>(new Set());

  const byId = useMemo<Record<string, Course>>(
    () =>
      Object.fromEntries(SAMPLE_COURSES.map((c) => [c.id, c])) as Record<
        string,
        Course
      >,
    []
  );

  function canSelect(next: Course): boolean {
    // 이미 선택된 강의들과 겹치면 불가
    for (const id of selected) {
      const cur = byId[id];
      if (isOverlap(cur, next)) return false;
    }
    return true;
  }

  function toggleCourse(id: string) {
    const course = byId[id];
    if (!course) return;

    // 추천 표시 초기화 규칙: 다른 강의를 추가/삭제하면 추천은 제거
    setRecommended(new Set());

    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!canSelect(course)) return prev; // 겹치면 무시
        next.add(id);
        // 새 추천 계산
        const rec = recommendAfterAdd(course, SAMPLE_COURSES, next);
        setRecommended(new Set(rec));
      }
      return next;
    });
  }

  function acceptRecommendation(id: string) {
    const course = byId[id];
    if (!course) return;
    if (!canSelect(course)) return; // 안전망
    setSelected((prev) => new Set(prev).add(id));
    // 추천을 클릭하면 해당 강의는 선택 상태로 전환, 추천은 모두 제거
    setRecommended(new Set());
  }

  return (
    <div className="bg-[#f2f4f6] min-h-screen w-full flex flex-col items-center gap-4 py-6">
      <h1 className="text-lg font-medium text-gray-800 w-[440px] px-6">
        시간표 추가
      </h1>

      {/* 시간표 그리드 */}
      <div className="bg-white w-[440px] rounded-[15px] p-4">
        <div className="grid grid-cols-6 gap-2">
          <div className="col-span-1">
            {/* 세로 시간 축 */}
            {Array.from({ length: 10 }).map((_, i) => {
              const hour = 9 + i; // 9~18
              return (
                <div key={i} className="h-[48px] text-[12px] text-gray-500">
                  {hour}:00
                </div>
              );
            })}
          </div>
          {DAYS.map((day) => (
            <div
              key={day}
              className="col-span-1 relative border-l border-gray-100 min-h-[480px]"
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[12px] text-gray-600">
                {day}
              </div>

              {/* 선택된 강의 */}
              {SAMPLE_COURSES.filter(
                (c) => c.day === day && selected.has(c.id)
              ).map((c) => (
                <div
                  key={`sel-${c.id}`}
                  className="absolute left-1 right-1 rounded-[4px] text-white text-[10px] p-1 overflow-hidden"
                  style={{
                    top: blockTop(c.start),
                    height: blockHeight(c.start, c.end),
                    backgroundColor: COLOR_ADDED,
                  }}
                  onClick={() => toggleCourse(c.id)}
                >
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="opacity-90">
                    {c.building}
                    {c.room} • {c.start}~{c.end}
                  </div>
                </div>
              ))}

              {/* 추천 강의 */}
              {SAMPLE_COURSES.filter(
                (c) => c.day === day && recommended.has(c.id)
              ).map((c) => (
                <button
                  key={`rec-${c.id}`}
                  className="absolute left-1 right-1 rounded-[4px] text-gray-900 text-[10px] p-1 border border-[#9adcf0]"
                  style={{
                    top: blockTop(c.start),
                    height: blockHeight(c.start, c.end),
                    backgroundColor: COLOR_RECOMMENDED,
                  }}
                  onClick={() => acceptRecommendation(c.id)}
                  title="추천 강의 적용"
                >
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="opacity-90">
                    {c.building}
                    {c.room} • {c.start}~{c.end}
                  </div>
                  <div className="text-[9px] text-[#0b6b8f]">
                    추천 • 클릭하면 추가
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 강의 목록 */}
      <div className="w-[440px] bg-white rounded-[15px] p-4">
        <div className="text-sm text-gray-800 mb-2">
          강의 목록 (누르면 추가/삭제)
        </div>
        <div className="grid grid-cols-1 gap-2">
          {SAMPLE_COURSES.map((c) => {
            const active = selected.has(c.id);
            const isRec = recommended.has(c.id);
            return (
              <button
                key={c.id}
                onClick={() =>
                  isRec ? acceptRecommendation(c.id) : toggleCourse(c.id)
                }
                className={`w-full text-left rounded-[10px] px-3 py-2 border transition-colors ${
                  active ? "text-white" : "text-gray-800"
                } ${active ? "" : "hover:bg-gray-50"}`}
                style={{
                  backgroundColor: active
                    ? COLOR_ADDED
                    : isRec
                    ? COLOR_RECOMMENDED
                    : "white",
                  borderColor: isRec ? "#9adcf0" : "#e5e7eb",
                }}
                title={
                  active
                    ? "클릭하면 삭제"
                    : isRec
                    ? "추천 강의 • 클릭하면 추가"
                    : "클릭하면 추가"
                }
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-[12px] opacity-80">
                    {c.day} {c.start}~{c.end}
                  </div>
                </div>
                <div className="text-[12px] opacity-80">
                  {c.building}
                  {c.room}
                </div>
              </button>
            );
          })}
        </div>
        <div className="text-[12px] text-gray-500 mt-3">
          • 선택하면 바로 추천이 표시됩니다. 추천은 동일 건물 우선, 인접 시간
          우선, 겹침 없음 규칙을 따릅니다.
        </div>
      </div>

      <div className="w-[440px] text-[12px] text-gray-500 px-1">
        참고 디자인:{" "}
        <a
          className="underline"
          href="https://www.figma.com/design/YbTtURozttM1veHcPtYVaz/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=168-442&t=Bc5Ge0Fih4QoJVUR-1"
          target="_blank"
          rel="noreferrer"
        >
          Figma 시간표 추가
        </a>
      </div>
    </div>
  );
}
