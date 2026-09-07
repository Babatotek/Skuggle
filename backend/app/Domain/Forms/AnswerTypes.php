<?php

namespace App\Domain\Forms;

final class AnswerTypes
{
    public const SHORT_ANSWER = 'short_answer';

    public const LONG_ANSWER = 'long_answer';

    public const NUMBER = 'number';

    public const DATE = 'date';

    public const DATE_TIME = 'date_time';

    public const YES_NO = 'yes_no';

    public const CHOOSE_ONE = 'choose_one';

    public const CHOOSE_MANY = 'choose_many';

    public const PHONE = 'phone';

    public const EMAIL = 'email';

    public const ADDRESS = 'address';

    public const FILE = 'file';

    public const PHOTO = 'photo';

    public const CURRENCY = 'currency';

    public const PERCENTAGE = 'percentage';

    /** @return list<string> */
    public static function all(): array
    {
        return [
            self::SHORT_ANSWER,
            self::LONG_ANSWER,
            self::NUMBER,
            self::DATE,
            self::DATE_TIME,
            self::YES_NO,
            self::CHOOSE_ONE,
            self::CHOOSE_MANY,
            self::PHONE,
            self::EMAIL,
            self::ADDRESS,
            self::FILE,
            self::PHOTO,
            self::CURRENCY,
            self::PERCENTAGE,
        ];
    }

    /** @return array<string, string> */
    public static function labels(): array
    {
        return [
            self::SHORT_ANSWER => 'Short Answer',
            self::LONG_ANSWER => 'Long Answer',
            self::NUMBER => 'Number',
            self::DATE => 'Date',
            self::DATE_TIME => 'Date & Time',
            self::YES_NO => 'Yes / No',
            self::CHOOSE_ONE => 'Choose One',
            self::CHOOSE_MANY => 'Choose Many',
            self::PHONE => 'Phone Number',
            self::EMAIL => 'Email',
            self::ADDRESS => 'Address',
            self::FILE => 'File Upload',
            self::PHOTO => 'Photo',
            self::CURRENCY => 'Currency',
            self::PERCENTAGE => 'Percentage',
        ];
    }

    public static function legacyType(string $answerType): string
    {
        return match ($answerType) {
            self::SHORT_ANSWER, self::PHONE, self::EMAIL, self::ADDRESS, self::CURRENCY, self::PERCENTAGE => 'text',
            self::NUMBER => 'number',
            self::DATE, self::DATE_TIME => 'date',
            self::YES_NO => 'boolean',
            self::CHOOSE_ONE, self::CHOOSE_MANY => 'select',
            self::LONG_ANSWER, self::FILE, self::PHOTO => 'text',
            default => 'text',
        };
    }
}
