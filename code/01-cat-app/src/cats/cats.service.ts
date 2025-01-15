import { Injectable } from "@nestjs/common";
import { Cat } from "./interfaces/cat.interface";
import { CreateCatDto } from "./dto/create-cat.dto";


@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  create(cat: CreateCatDto) {
    this.cats.push(cat);
  }

  findAll():Promise<Cat[]> {
    return Promise.resolve(this.cats);
  }
}