/* import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { User } from "./User"

@Entity()
export class Group {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    alias: string;

    @Column()
    name: string;

    @Column()
    url: string;

    @Column()
    description: string;

    @OneToMany(type => User, user => user.group)
    users: User[];

} */
