import { Exclude, Expose, Transform } from 'class-transformer';
import { RoleEntity } from './role.entity';

export class UserEntity {
  id: number;
  firstName: string;
  lastName: string;

  @Exclude()
  password: string;

  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @Transform(({ value }) => value.name)
  role: RoleEntity;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
  // 参数 partial 的类型是 Partial<UserEntity>。Partial<T> 是 TypeScript 提供的一个实用类型，它将所有属性设置为可选的。这意味着 partial 可以是一个包含 UserEntity 部分或全部属性的对象。
}