import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../generated/prisma/client';
import { Profile } from '../generated/prisma/enums';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const password = await this.hashPassword(createUserDto.password);
    const user = await this.prisma.user.create({
      data: { ...createUserDto, password, profile: Profile.USER },
    });

    return this.toResponse(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany();
    return users.map((user) => this.toResponse(user));
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    return this.toResponse(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const data = {
      ...updateUserDto,
      password: updateUserDto.password
        ? await this.hashPassword(updateUserDto.password)
        : undefined,
    };

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    return this.toResponse(user);
  }

  remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  toResponse(user: User) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }
}
