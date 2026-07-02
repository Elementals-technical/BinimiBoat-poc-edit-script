/**
 * Мінімальний логер (порт з Hasting, спрощений).
 * Вмикається прапорцем LoggerService.enabled.
 */
export class LoggerService {
    static enabled = true;

    static log(ctx, msg, data) {
        if (!LoggerService.enabled) return;
        if (data !== undefined) console.log(msg, data);
        else console.log(msg);
    }

    static warn(ctx, msg, data) {
        if (data !== undefined) console.warn(msg, data);
        else console.warn(msg);
    }

    static error(ctx, msg, data) {
        if (data !== undefined) console.error(msg, data);
        else console.error(msg);
    }
}
