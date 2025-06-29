import { calculatePrice } from "../../utils/calculatePrice.js";

describe("calculatePrice", () => {
  it("рассчитывает цену без гибкости", () => {
    const result = calculatePrice({
      startTime: "10:00",
      endTime: "12:00",
      pricePerHour: 200,
      isFlexible: false,
      flexibilityRange: 0,
    });
    expect(result).toBe(400);
  });

  it("учитывает гибкость (скидка 50%)", () => {
    const result = calculatePrice({
      startTime: "10:00",
      endTime: "13:00",
      pricePerHour: 100,
      isFlexible: true,
      flexibilityRange: 30,
    });
    // 180 минут * 100р/60м = 300р. Из них 30 минут гибкие, на них скидка 50%
    // 150 минут по 100р/час = 250р
    // 30 минут по 50р/час = 25р
    // Итого: 275р
    expect(result).toBe(275);
  });
});
