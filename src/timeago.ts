type TDate = Date | string | number;

interface Options {
  readonly relativeDate?: TDate;
}

const SECOND = 1 * 1000;
const MINUTE = 1 * 60 * SECOND;
const HOUR = 1 * 60 * MINUTE;
const DAY = 1 * 24 * HOUR;
const WEEK = 1 * 7 * DAY;
const MONTH = (1 * 365 * DAY) / 12;
const YEAR = 1 * 365 * DAY;

const TIME_MAP = [
  {
    value: MINUTE,
    text: 'minute',
  },
  {
    value: HOUR,
    text: 'hour',
  },
  {
    value: DAY,
    text: 'day',
  },
  {
    value: WEEK,
    text: 'week',
  },
  {
    value: MONTH,
    text: 'month',
  },
  {
    value: YEAR,
    text: 'year',
  },
  {
    value: Infinity,
    text: '',
  },
];

export default function format(date: TDate, opts: Options = {}): string {
  const { relativeDate } = opts;

  const now = relativeDate ? toDate(relativeDate) : new Date();
  const diff = +toDate(date) - +now;

  const [ago, future] = formatDiff(Math.abs(diff));
  return diff < 0 ? ago : future;
}

function formatDiff(diff: number): [string, string] {
  let index = TIME_MAP.findIndex((item) => diff < item.value);

  if (index <= 0) {
    return ['just now', 'right now'];
  }

  const { value, text } = TIME_MAP[--index];
  const count = Math.floor(diff / value);
  const unit = diff > 1 ? `${text}s` : text;

  return [`${count} ${unit} ago`, `in ${count} ${unit}`];
}

function toDate(input: Date | string | number): Date {
  if (input instanceof Date) {
    return input;
  }

  if (isNumber(input)) {
    return new Date(parseInt(String(input)));
  }

  return new Date(input);
}

function isNumber(data: string | number): data is number {
  return typeof data === 'number' || /^\d+$/.test(data);
}
