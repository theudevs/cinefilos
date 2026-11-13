import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '../generated/prisma/client';
import {
  isOcupacaoPoltronaUniqueConflict,
  OCUPACAO_POLTRONA_CONFLICT_MESSAGE,
} from '../pedidos/ocupacao-poltrona-conflict';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const { statusCode, message } = this.getErrorResponse(exception);

    response.status(statusCode).json({
      statusCode,
      message,
      error: this.getHttpErrorName(statusCode),
    });
  }

  private getErrorResponse(exception: Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          message: isOcupacaoPoltronaUniqueConflict(exception)
            ? OCUPACAO_POLTRONA_CONFLICT_MESSAGE
            : `Já existe um registro com este valor: ${this.formatTarget(exception.meta?.target)}.`,
        };
      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message:
            'Não foi possível concluir a operação porque um registro relacionado não existe ou está em uso.',
        };
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Registro não encontrado.',
        };
      default:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Não foi possível concluir a operação no banco de dados.',
        };
    }
  }

  private formatTarget(target: unknown) {
    if (Array.isArray(target)) {
      return target.join(', ');
    }

    if (typeof target === 'string') {
      return target;
    }

    return 'campo único';
  }

  private getHttpErrorName(statusCode: number) {
    switch (statusCode) {
      case HttpStatus.CONFLICT:
        return 'Conflict';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      default:
        return 'Bad Request';
    }
  }
}
