import { Injectable } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';
import { getD2Template, writeD2Output } from '@/func';

interface User {
  users: string[];
  notUsedUsers: string[];
  notUsedMFAUsers: string[];
  notChangePasswordUsers: string[];
}

@Injectable()
export class UserSecurityService {
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

  updateUserSecurityTemplate(): string {
    const userJson: User = this.getUserData();
    const { users, notUsedUsers, notUsedMFAUsers, notChangePasswordUsers } =
      userJson;
    const filename = 'security-users';

    let userId = '';
    users.forEach((user: string, idx: number) => {
      userId += `\tuser${idx + 1}: ${user}\n`;
    });

    const d2Template = getD2Template(filename);
    const updatedVars = d2Template.replace('"{{update-vars}}"', userId);

    const totalUserBox = this.createUserBox(users);
    const updatedUsers = updatedVars.replace(
      '"{{update-total-box}}"',
      totalUserBox,
    );

    const unUsedUserBox = this.createUserBox(notUsedUsers);
    const updatedunUsedUsers = updatedUsers.replace(
      '"{{update-unused-box}}"',
      unUsedUserBox,
    );

    const unusedMFAUserBox = this.createUserBox(notUsedMFAUsers);
    const updatedUnusedMFAUserBox = updatedunUsedUsers.replace(
      '"{{update-mfa-violated-box}}"',
      unusedMFAUserBox,
    );

    const notChangedUserBox = this.createUserBox(notChangePasswordUsers);
    const updatedNotChangedUserBox = updatedUnusedMFAUserBox.replace(
      '"{{update-password-aged-box}}"',
      notChangedUserBox,
    );

    writeD2Output(filename, updatedNotChangedUserBox);
    return updatedNotChangedUserBox;
  }
}
