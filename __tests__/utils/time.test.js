import { timeToMinutes, minutesToTime } from "../../utils/time.js";

describe("timeToMinutes", () => {
  it("должна правильно конвертировать время в минуты", () => {
    expect(timeToMinutes("08:00")).toBe(480);
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("23:59")).toBe(1439);
  });
});

describe("minutesToTime", () => {
  it("должна правильно конвертировать минуты в строку времени", () => {
    expect(minutesToTime(480)).toBe("08:00");
    expect(minutesToTime(0)).toBe("00:00");
    expect(minutesToTime(1439)).toBe("23:59");
  });
});
