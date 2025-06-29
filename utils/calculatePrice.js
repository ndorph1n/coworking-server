import { timeToMinutes } from "./time.js";

export function calculatePrice({
  startTime,
  endTime,
  pricePerHour,
  isFlexible,
  flexibilityRange,
}) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const duration = end - start;

  console.log(duration);

  if (duration <= 0) return 0;

  const totalHours = duration / 60;

  let basePrice = totalHours * pricePerHour;

  if (isFlexible && flexibilityRange) {
    // Гибкое время: в минутах
    const flexibleMinutes = Math.min(flexibilityRange, duration);
    const flexibleHours = flexibleMinutes / 60;
    console.log(flexibleMinutes, flexibleHours);

    // Скидка 50% на гибкое время
    const discount = 0.5 * flexibleHours * pricePerHour;
    console.log(discount);
    basePrice -= discount;
  }

  return Math.round(basePrice); // можно округлить до целого
}
