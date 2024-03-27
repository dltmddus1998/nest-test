import { Injectable } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';
import { getD2Template, writeD2Output, replaceValue } from '@/func';

interface User {
  users: string[];
  notUsedUsers: string[];
  notUsedMFAUsers: string[];
  notChangedPasswordUsers: string[];
}

@Injectable()
export class UserSecurityService {
  updateUserSecurityTemplate(): string {
    const userJson: User = this.getUserData();
    const { users, notUsedUsers, notUsedMFAUsers, notChangedPasswordUsers } =
      userJson;
    const filename = 'security-users';

    const userId = this.updateVars(users);

    const d2Template = getD2Template(filename);
    const updatedVars = replaceValue(d2Template, '"{{update-vars}}"', userId);

    const totalUserBox = this.createUserBox(users);
    const updatedUsers = replaceValue(
      updatedVars,
      '"{{update-total-box}}"',
      totalUserBox,
    );

    const unUsedUserBox = this.createUserBox(notUsedUsers);
    const updatedunUsedUsers = replaceValue(
      updatedUsers,
      '"{{update-unused-box}}"',
      unUsedUserBox,
    );

    const unusedMFAUserBox = this.createUserBox(notUsedMFAUsers);
    const updatedUnusedMFAUserBox = replaceValue(
      updatedunUsedUsers,
      '"{{update-mfa-violated-box}}"',
      unusedMFAUserBox,
    );

    const notChangedUserBox = this.createUserBox(notChangedPasswordUsers);
    const updatedNotChangedUserBox = replaceValue(
      updatedUnusedMFAUserBox,
      '"{{update-password-aged-box}}"',
      notChangedUserBox,
    );

    writeD2Output(filename, updatedNotChangedUserBox);
    return updatedNotChangedUserBox;
  }

  private getUserData(): any {
    try {
      const userData = fs.readFileSync(
        join(__dirname, '../../data/user.json'),
        'utf8',
      );
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error reading user.json file:', error);
      return null;
    }
  }

  private updateVars(users: string[]) {
    let userId = '';
    users.forEach((user: string, idx: number) => {
      userId += `\n`;
      userId += `    user${idx + 1}: ${user}\n`;
    });
    return userId;
  }

  private createUserBox(usersCategory: any[]): any {
    let totalUserBox = '';

    usersCategory.forEach((userCategory, i) => {
      totalUserBox += `\tbox-user${i + 1}.class: box-icon \n`;
      totalUserBox += `box-user${i + 1}: "" {\n`;
      totalUserBox += `  label: ${userCategory}\n`;
      totalUserBox += `  iconthis.class: icon-user\n`;
      totalUserBox += `}\n\n`;
    });
    return totalUserBox;
  }
}
