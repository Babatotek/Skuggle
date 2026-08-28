<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>{{ $title }}</title>
</head>
<body style="margin:0;background:#f5f3ff;font-family:Arial,Helvetica,sans-serif;color:#172033">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">{{ $preheader }}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f3ff;padding:28px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 14px 38px rgba(49,29,128,.14)">
    <tr><td style="padding:28px 34px;background:linear-gradient(135deg,#24105f,#5b36e8 64%,#7657ff)">
        <img src="{{ rtrim(config('skuggle.frontend_url'), '/') }}/skuggle-logo.png" width="150" alt="Skuggle" style="display:block;max-width:150px;height:auto">
    </td></tr>
    <tr><td style="padding:38px 38px 18px">
        <div style="font-size:12px;line-height:18px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#6847ee">{{ $eyebrow }}</div>
        <h1 style="margin:10px 0 14px;font-size:30px;line-height:38px;color:#111a33">{{ $title }}</h1>
        <p style="margin:0;font-size:16px;line-height:26px;color:#536078">{{ $intro }}</p>
    </td></tr>
    <tr><td style="padding:12px 38px 26px">
        <a href="{{ $buttonUrl }}" style="display:inline-block;padding:14px 24px;border-radius:12px;background:#5b36e8;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700">{{ $buttonLabel }}</a>
    </td></tr>
    @if(!empty($details))
    <tr><td style="padding:0 38px 28px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8f7ff;border:1px solid #e8e3ff;border-radius:14px">
        @foreach($details as $detail)
            <tr><td style="padding:10px 16px;font-size:14px;line-height:21px;color:#4a5570"><span style="color:#5b36e8;font-weight:700">&#10003;</span>&nbsp; {{ $detail }}</td></tr>
        @endforeach
        </table>
    </td></tr>
    @endif
    <tr><td style="padding:0 38px 38px;font-size:14px;line-height:22px;color:#69758b">{{ $closing }}</td></tr>
    <tr><td style="padding:24px 34px;background:#17112c;color:#c9c2e8;text-align:center;font-size:12px;line-height:19px">
        <strong style="color:#ffffff">Skuggle</strong><br>One identity. Every learning space.<br>
        <span style="color:#9185bd">This is a transactional account email. Please do not share secure links.</span>
    </td></tr>
</table>
</td></tr></table>
</body>
</html>
