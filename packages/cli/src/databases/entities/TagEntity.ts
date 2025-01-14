/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable import/no-cycle */
import {
	BeforeUpdate,
	Column,
	ColumnOptions,
	Entity,
	Index,
	ManyToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { IsDate, IsOptional, IsString, Length } from 'class-validator';

import config = require('../../../config');
import { DatabaseType } from '../../index';
import { ITagDb } from '../../Interfaces';
import { WorkflowEntity } from './WorkflowEntity';

function resolveDataType(dataType: string) {
	const dbType = config.get('database.type') as DatabaseType;

	const typeMap: { [key in DatabaseType]: { [key: string]: string } } = {
		sqlite: {
			json: 'simple-json',
		},
		postgresdb: {
			datetime: 'timestamptz',
		},
		mysqldb: {},
		mariadb: {},
	};

	return typeMap[dbType][dataType] ?? dataType;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function getTimestampSyntax() {
	const dbType = config.get('database.type') as DatabaseType;

	const map: { [key in DatabaseType]: string } = {
		sqlite: "STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')",
		postgresdb: 'CURRENT_TIMESTAMP(3)',
		mysqldb: 'CURRENT_TIMESTAMP(3)',
		mariadb: 'CURRENT_TIMESTAMP(3)',
	};

	return map[dbType];
}

@Entity()
export class TagEntity implements ITagDb {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ length: 24 })
	@Index({ unique: true })
	@IsString({ message: 'Tag name must be of type string.' })
	@Length(1, 24, { message: 'Tag name must be 1 to 24 characters long.' })
	name: string;

	@Column({
		type: resolveDataType('datetime') as ColumnOptions['type'],
		precision: 3,
		default: () => getTimestampSyntax(),
	})
	@IsOptional() // ignored by validation because set at DB level
	@IsDate()
	createdAt: Date;

	@Column({
		type: resolveDataType('datetime') as ColumnOptions['type'],
		precision: 3,
		default: () => getTimestampSyntax(),
		onUpdate: getTimestampSyntax(),
	})
	@IsOptional() // ignored by validation because set at DB level
	@IsDate()
	updatedAt: Date;

	@ManyToMany(() => WorkflowEntity, (workflow) => workflow.tags)
	workflows: WorkflowEntity[];

	@BeforeUpdate()
	setUpdateDate() {
		this.updatedAt = new Date();
	}
}
