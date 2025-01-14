# 数据库

Nest 与数据库无关，使你可以轻松地与任何 SQL 或 NoSQL 数据库集成。

Nest 提供了与 TypeORM 的紧密集成，开箱即用的 Sequelize 分别带有 @nestjs/typeorm 和 @nestjs/sequelize 包

## TypeORM

为了与 SQL 和 NoSQL 数据库集成，Nest 提供了 @nestjs/typeorm 包。TypeORM 是可用于 TypeScript 的最成熟的对象关系映射器 (ORM)。由于它是用 TypeScript 编写的，因此可以很好地与 Nest 框架集成。

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```

完成后，TypeORM DataSource 和 EntityManager 对象将可用于在整个项目中注入（无需导入任何模块）

forRoot() 方法支持 TypeORM 包中的 DataSource 构造函数公开的所有配置属性。此外，还有下面描述的几个额外的配置属性。

retryAttempts	        尝试连接数据库的次数（默认： XSPACE10）
retryDelay	            连接重试尝试之间的延迟（毫秒）（默认值： XSPACE3000）
autoLoadEntities	    如果是 true，实体将自动加载（默认： false）


## 存储库模式

TypeORM 支持存储库设计模式，因此每个实体都有自己的存储库。这些存储库可以从数据库数据源中获得。

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

该模块使用 forFeature() 方法来定义在当前作用域内注册了哪些存储库。有了它，我们可以使用 @InjectRepository() 装饰器将 UsersRepository 注入到 UsersService 中：

```ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
```

## 关系


关系是两个或多个表之间建立的关联。关系基于每个表中的公共字段，通常涉及主键和外键。

存在三种类型的关系：

One-to-one	                主表中的每一行在外表中都有且仅有一个关联行。使用 @OneToOne() 装饰器来定义这种类型的关系。
One-to-many / Many-to-one	主表中的每一行在外表中都有一个或多个相关行。使用 @OneToMany() 和 @ManyToOne() 装饰器来定义这种类型的关系。
Many-to-many	            主表中的每一行在外表中都有许多相关的行，并且外表中的每条记录在主表中都有许多相关的行。使用 @ManyToMany() 装饰器来定义这种类型的关系。

```ts
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Photo } from '../photos/photo.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(type => Photo, photo => photo.user)
  photos: Photo[];
}
```

## 自动加载实体

手动将实体添加到数据源选项的 entities 数组可能很乏味。此外，从根模块引用实体会破坏应用域边界，并导致将实现细节泄漏到应用的其他部分。为解决此问题，提供了替代解决方案。要自动加载实体，请将配置对象的 autoLoadEntities 属性（传递给 forRoot() 方法）设置为 true，如下所示：

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...
      autoLoadEntities: true,
    }),
  ],
})
export class AppModule {}
```

指定该选项后，通过 forFeature() 方法注册的每个实体都将自动添加到配置对象的 entities 数组中。未通过 forFeature() 方法注册但仅从实体引用（通过关系）的实体将不会通过 autoLoadEntities 设置包含在内。

## 分离实体定义

## TypeORM事务

数据库事务象征着在数据库管理系统中针对数据库执行的工作单元，并以独立于其他事务的一致且可靠的方式进行处理。事务通常表示数据库中的任何更改。

有许多不同的策略来处理 TypeORM 事务。我们建议使用 QueryRunner 类，因为它可以完全控制事务。

现在，我们可以使用这个对象来创建一个事务。

```ts
async createMany(users: User[]) {
  const queryRunner = this.dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    await queryRunner.manager.save(users[0]);
    await queryRunner.manager.save(users[1]);

    await queryRunner.commitTransaction();
  } catch (err) {
    // since we have errors lets rollback the changes we made
    await queryRunner.rollbackTransaction();
  } finally {
    // you need to release a queryRunner which was manually instantiated
    await queryRunner.release();
  }
}
```

dataSource 仅用于创建 QueryRunner。但是，要测试此类，需要模拟整个 DataSource 对象（它公开了几个方法）。因此，我们建议使用辅助工厂类（例如 QueryRunnerFactory）并定义一个接口，其中包含维护事务所需的一组有限方法。

将回调式方法与 DataSource 对象的 transaction 方法结合使用。

```ts
async createMany(users: User[]) {
  await this.dataSource.transaction(async manager => {
    await manager.save(users[0]);
    await manager.save(users[1]);
  });
}
```

## subscribers 订阅者

使用 TypeORM subscribers，你可以监听特定的实体事件。

```ts
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { User } from './user.entity';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  beforeInsert(event: InsertEvent<User>) {
    console.log(`BEFORE USER INSERTED: `, event.entity);
  }
}
```
事件订阅者不能是 request-scoped。

将 UserSubscriber 类添加到 providers 数组：
```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserSubscriber } from './user.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, UserSubscriber],
  controllers: [UsersController],
})
export class UsersModule {}
```

## 多数据库

一些项目需要多个数据库连接。这也可以通过这个模块来实现。要使用多个连接，首先要创建连接。在这种情况下，数据源命名就成为强制性的。

```ts
const defaultOptions = {
  type: 'postgres',
  port: 5432,
  username: 'user',
  password: 'password',
  database: 'db',
  synchronize: true,
};

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...defaultOptions,
      host: 'user_db_host',
      entities: [User],
    }),
    TypeOrmModule.forRoot({
      ...defaultOptions,
      name: 'albumsConnection',
      host: 'album_db_host',
      entities: [Album],
    }),
  ],
})
export class AppModule {}
```

如果没有为数据源设置 name，则其名称将设置为 default。请注意，你不应该有多个没有名称或具有相同名称的连接，否则它们将被覆盖。


使用此设置，你必须告诉 TypeOrmModule.forFeature() 方法和 @InjectRepository() 装饰器应该使用哪个数据源。如果不传递任何数据源名称，则使用 default 数据源。

```ts
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Album], 'albumsConnection'),
  ],
})
export class AppModule {}
```

## 测试

当谈到对应用进行单元测试时，我们通常希望避免建立数据库连接，保持我们的测试套件独立并尽可能快地执行它们。但是我们的类可能依赖于从数据源（连接）实例中提取的存储库。我们如何处理？解决方案是创建模拟存储库。为了实现这一目标，我们成立了 定制提供器。每个注册的存储库自动由一个 <EntityName>Repository 令牌表示，其中 EntityName 是你的实体类的名称。

@nestjs/typeorm 包公开了 getRepositoryToken() 函数，该函数返回基于给定实体的准备好的令牌。

```ts
@Module({
  providers: [
    UsersService,
    {
      provide: getRepositoryToken(User),
      useValue: mockRepository,
    },
  ],
})
export class UsersModule {}
```
现在替代 mockRepository 将用作 UsersRepository。每当任何类使用 @InjectRepository() 装饰器请求 UsersRepository 时，Nest 将使用已注册的 mockRepository 对象。

## 异步配置

希望异步而不是静态地传递你的存储库模块选项。在这种情况下，使用 forRootAsync() 方法，它提供了几种处理异步配置的方法。

一种方法是使用工厂函数：

```ts
TypeOrmModule.forRootAsync({
  useFactory: () => ({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'test',
    entities: [],
    synchronize: true,
  }),
});
```

我们的工厂的行为与任何其他 异步提供器 一样（例如，它可以是 async，并且能够通过 inject 注入依赖）。

```ts
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    entities: [],
    synchronize: true,
  }),
  inject: [ConfigService],
});
```

或者，你可以使用 useClass 语法：

```ts
TypeOrmModule.forRootAsync({
  useClass: TypeOrmConfigService,
});

```

上面的构造将在 TypeOrmModule 中实例化 TypeOrmConfigService，并通过调用 createTypeOrmOptions() 使用它来提供选项对象。请注意，这意味着 TypeOrmConfigService 必须实现 TypeOrmOptionsFactory 接口，如下所示：

```ts

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [],
      synchronize: true,
    };
  }
}

```

## 自定义数据源工厂

结合使用 useFactory、useClass 或 useExisting 的异步配置，你可以选择指定 dataSourceFactory 函数，这将允许你提供自己的 TypeORM 数据源，而不是允许 TypeOrmModule 创建数据源。

dataSourceFactory 接收使用 useFactory、useClass 或 useExisting 在异步配置期间配置的 TypeORM DataSourceOptions，并返回解析 TypeORM DataSource 的 Promise。

```ts
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  // Use useFactory, useClass, or useExisting
  // to configure the DataSourceOptions.
  useFactory: (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    entities: [],
    synchronize: true,
  }),
  // dataSource receives the configured DataSourceOptions
  // and returns a Promise<DataSource>.
  dataSourceFactory: async (options) => {
    const dataSource = await new DataSource(options).initialize();
    return dataSource;
  },
});
```

## Sequelize 集成

另一个使用TypeORM的选择是使用@nestjs/sequelize包中的Sequelize ROM。额外地，我们使用sequelize-typescript包来提供一系列额外的装饰器以声明实体。

```ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      models: [],
    }),
  ],
})
export class AppModule {}
```

forRoot()方法支持所有Sequelize构造器(了解更多)暴露的配置属性。下面是一些额外的配置属性。

名称	                    说明
retryAttempts	          尝试连接数据库的次数（默认：10）
retryDelay	            两次连接之间间隔时间(ms)(默认：3000)
autoLoadModels	        如果为true，模型将自动载入（默认:false)
keepConnectionAlive	    如果为true，在应用关闭后连接将不会关闭（默认:false)
synchronize	            如果为true，自动载入的模型将同步（默认：false）

## 模型

Sequelize采用活动记录(Active Record)模式，在这一模式下，你可以使用模型类直接和数据库交互。要继续该示例，我们至少需要一个模型，让我们定义这个User模型：

```ts
import { Column, Model, Table } from 'sequelize-typescript';

@Table
export class User extends Model<User> {
  @Column
  firstName: string;

  @Column
  lastName: string;

  @Column({ defaultValue: true })
  isActive: boolean;
}
```

要开始使用User模型，我们需要通过将其插入到forRoot()方法选项的models数组中来让Sequelize知道它的存在。


```ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './users/user.model';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      models: [User],
    }),
  ],
})
export class AppModule {}

```

```ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.model';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}

```
这个模块使用forFeature()方法来定义哪个模型被注册在当前范围中。我们可以使用@InjectModel()装饰器来把UserModel注入到UsersService中。

```ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel.findAll();
  }

  findOne(id: string): Promise<User> {
    return this.userModel.findOne({
      where: {
        id,
      },
    });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await user.destroy();
  }
}
```

## 关系

关系是指两个或多个表之间的联系。关系基于每个表中的常规字段，通常包含主键和外键。

关系有三种：

名称	            说明
一对一	        主表中的每一行在外部表中有且仅有一个对应行。
一对多/多对一	   主表中的每一行在外部表中有一个或多的对应行。
多对多	        主表中的每一行在外部表中有多个对应行，外部表中的每个记录在主表中也有多个行。

## 自动载入模型

手动将模型一一添加到连接选项的models数组中的工作会很无聊。此外，在根模块中涉及实体破坏了应用的域边界，并可能将应用的细节泄露给应用的其他部分。针对这一情况，在配置对象的属性中(传递给forRoot()方法的)设置autoLoadModels和synchronize属性来自动载入模型

## 事务

数据库事务代表在数据库管理系统（DBMS）中针对数据库的一组操作，这组操作是有关的、可靠的并且和其他事务相互独立的。一个事务通常可以代表数据库中的任何变更（了解更多)。

在Sequelize事务中有很多不同策略来处理事务，下面是一个管理事务的示例（自动回调）。

首先，我们需要将Sequelize对象以正常方式注入。。。。


PS: 这部分其实很多都和TypeORM相同
