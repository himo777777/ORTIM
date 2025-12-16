import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { QuizModule } from './quiz/quiz.module';
import { CertificatesModule } from './certificates/certificates.module';
import { InstructorModule } from './instructor/instructor.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    CoursesModule,
    QuizModule,
    CertificatesModule,
    InstructorModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
