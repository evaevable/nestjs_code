import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { User } from "./user.entity";
import { Repository } from "typeorm";
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
    // 按照之前学习java的思路来说，这里其实就是一个Mapper，我们无须自定义mapper，直接将User传入这个Repository即可，这样子我们直接用的就是User的curd的数据库表操作
  ) {}

  create(createUserDto: CreateUserDto): Promise<User> {
    const user = new User();
    user.firstName = createUserDto.firstName;
    user.lastName = createUserDto.lastName;
    // 通过这里我们可以看到 dto是 数据传输的，与最终传入数据库的数据可能不一样， entity实体类才是真正操作数据库的类
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  findOne(id: number): Promise<User> {
    return this.userRepository.findOneBy({id : id});
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}