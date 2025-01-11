import { Point, ConnectionPoint } from "../types/workflow";
import { CLASSNAMES, FUNCTION_DEFAULTS } from "../constants/workflow";

export const getConnectionPoint = ({
  element,
  type,
  containerRect,
}: ConnectionPoint): Point | null => {
  const point =
    type === "input"
      ? element
          .querySelector(`.${CLASSNAMES.INPUT_POINT}`)
          ?.getBoundingClientRect()
      : element
          .querySelector(`.${CLASSNAMES.OUTPUT_POINT}`)
          ?.getBoundingClientRect();

  if (!point) return null;

  return {
    x: point.left + point.width / 2 - containerRect.left,
    y: point.top + point.height / 2 - containerRect.top,
  };
};

export const createPath = (
  start: Point,
  end: Point,
  isTerminal: boolean = false
): string => {
  if (isTerminal) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const isHorizontal = Math.abs(dy) < FUNCTION_DEFAULTS.ALIGNMENT_THRESHOLD;
  const isVertical = Math.abs(dx) < FUNCTION_DEFAULTS.ALIGNMENT_THRESHOLD;

  if (isHorizontal || isVertical) {
    if (isHorizontal) {
      const radius = Math.abs(dx) / 2;
      const midX = (start.x + end.x) / 2;
      const midY = start.y + radius;

      return `M ${start.x} ${start.y}
              Q ${midX} ${midY},
                ${end.x} ${end.y}`;
    } else {
      const radius = Math.abs(dy) / 2;
      const midX = start.x + radius;
      const midY = (start.y + end.y) / 2;

      return `M ${start.x} ${start.y}
              Q ${midX} ${midY},
                ${end.x} ${end.y}`;
    }
  }

  const curvature = FUNCTION_DEFAULTS.CURVE_CURVATURE;
  const offsetX = dx * curvature;
  const cp1x = start.x + offsetX;
  const cp1y = start.y;
  const cp2x = end.x - offsetX;
  const cp2y = end.y;

  return `M ${start.x} ${start.y}
          C ${cp1x} ${cp1y},
            ${cp2x} ${cp2y},
            ${end.x} ${end.y}`;
};

export const evaluateExpression = (expression: string, x: number): number => {
  try {
    // First replace x^2 with x**2 for JavaScript math
    let jsExpression = expression.replace(/x\^(\d+)/g, "x**$1");

    // Handle implicit multiplication (like 2x) by adding *
    jsExpression = jsExpression.replace(/(\d)x/g, "$1*x");

    // Then replace x with the number
    jsExpression = jsExpression.replace(/x/g, `${x}`);

    // Create a safe function to evaluate the expression
    const mathFunction = new Function("return " + jsExpression);
    const result = mathFunction();

    console.log(`Expression: ${expression}, x: ${x}, evaluated: ${result}`);
    return Number(result.toFixed(2));
  } catch (error) {
    console.error("Error evaluating expression:", error);
    return 0;
  }
};
