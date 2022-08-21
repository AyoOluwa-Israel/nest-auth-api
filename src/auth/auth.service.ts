import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
// import { async, Observable } from 'rxjs';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { NewUserDto } from 'src/users/dtos/newUser.dto';
import { UserDetails } from 'src/users/userDetails.interface';
import { ExistingUserDTO } from 'src/users/dtos/existingUser.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async hashedPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
  async register(user: Readonly<NewUserDto>): Promise<UserDetails | any> {
    const { name, email, password } = user;
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) return { message: 'Email Already Exits' };

    const hashedPassword = await this.hashedPassword(password);

    const newUser = await this.userService.create(name, email, hashedPassword);
    return this.userService._getUserDetails(newUser);
  }

  async doesPasswordMatch(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserDetails | any> {
    const user = await this.userService.findByEmail(email);
    const doesUserExist = !!user;
    if (!doesUserExist) return null;
    const doesPasswordMatch = await this.doesPasswordMatch(
      password,
      user.password,
    );
    if (!doesPasswordMatch) return null;
    return this.userService._getUserDetails(user);
  }

  async login(existingUser: ExistingUserDTO): Promise<{ token: string } | any> {
    const { email, password } = existingUser;
    const existingMail = await this.userService.findByEmail(email);

    if (!existingMail) return { message: 'This email is not regsitered!' };

    const user = await this.validateUser(email, password);

    if (!user) return { message: 'Invalid Credentials!!' };

    const jwt = await this.jwtService.signAsync({ user });
    return { message: 'Login Successfully!!', token: jwt };
  }
}
