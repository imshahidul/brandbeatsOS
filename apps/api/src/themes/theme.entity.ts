import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ThemeVisibility = 'public' | 'private' | 'deprecated';

@Entity('themes')
export class Theme {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  slug!: string;

  @Column()
  name!: string;

  @Column({ default: 'private' })
  visibility!: ThemeVisibility;

  /** 'free' | 'paid' — paid enforcement lands in Phase 3+. */
  @Column({ default: 'free' })
  monetization!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
