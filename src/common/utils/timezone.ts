export interface LocalDateParts {
  year: number;
  month: number;
  day: number;
}

export interface LocalTimeParts {
  hour: number;
  minute: number;
  second: number;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function parseDateOnly(value: string): LocalDateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function parseTime(value: string): LocalTimeParts | null {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? 0);

  if (
    hour < 0 ||
    hour > 24 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59 ||
    (hour === 24 && (minute !== 0 || second !== 0))
  ) {
    return null;
  }

  return { hour, minute, second };
}

export function getDayOfWeek(date: LocalDateParts): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

export function addDays(date: LocalDateParts, amount: number): LocalDateParts {
  const result = new Date(
    Date.UTC(date.year, date.month - 1, date.day + amount),
  );

  return {
    year: result.getUTCFullYear(),
    month: result.getUTCMonth() + 1,
    day: result.getUTCDate(),
  };
}

export function zonedDateTimeToUtc(
  date: LocalDateParts,
  time: LocalTimeParts,
  timeZone: string,
): Date {
  const utcGuess = Date.UTC(
    date.year,
    date.month - 1,
    date.day,
    time.hour,
    time.minute,
    time.second,
  );
  let timestamp = utcGuess;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offset = getTimeZoneOffsetMs(new Date(timestamp), timeZone);
    timestamp = utcGuess - offset;
  }

  return new Date(timestamp);
}

export function localDateRangeToUtc(
  date: LocalDateParts,
  timeZone: string,
): { start: Date; end: Date } {
  return {
    start: zonedDateTimeToUtc(
      date,
      { hour: 0, minute: 0, second: 0 },
      timeZone,
    ),
    end: zonedDateTimeToUtc(
      addDays(date, 1),
      { hour: 0, minute: 0, second: 0 },
      timeZone,
    ),
  };
}

export function formatInTimeZone(date: Date, timeZone: string): string {
  const parts = getZonedParts(date, timeZone);
  const offset = getTimeZoneOffsetMs(date, timeZone);
  const sign = offset >= 0 ? '+' : '-';
  const absoluteOffsetMinutes = Math.abs(offset / 60_000);
  const offsetHours = Math.floor(absoluteOffsetMinutes / 60);
  const offsetMinutes = absoluteOffsetMinutes % 60;

  return (
    `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}` +
    `T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}` +
    `${sign}${pad(offsetHours)}:${pad(offsetMinutes)}`
  );
}

export function getLocalDateFromInstant(
  date: Date,
  timeZone: string,
): LocalDateParts {
  const parts = getZonedParts(date, timeZone);

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return asUtc - date.getTime();
}

function getZonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const values = formatter
    .formatToParts(date)
    .reduce<Record<string, number>>((result, part) => {
      if (part.type !== 'literal') {
        result[part.type] = Number(part.value);
      }

      return result;
    }, {});

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function pad(value: number, size = 2): string {
  return String(value).padStart(size, '0');
}
