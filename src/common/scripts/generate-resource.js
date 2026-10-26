const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const pluralName = process.argv[2];
const singularName = process.argv[3];

if (!pluralName || !singularName) {
  console.error('Uso: npm run gr -- <plural> <singular>');
  console.error('Ejemplo: npm run gr -- trips trip');
  process.exit(1);
}

const resourceDirectory = path.join(
  process.cwd(),
  'src',
  'modules',
  pluralName,
);

function run(command) {
  console.log(`\n> ${command}`);

  execSync(command, {
    stdio: 'inherit',
  });
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, {
    encoding: 'utf8',
  });

  console.log(`UPDATE ${path.relative(process.cwd(), filePath)}`);
}

const pluralClassName = capitalize(pluralName);
const singularClassName = capitalize(singularName);

try {
  /*
   * Genera controller, service, módulo, DTOs, entity
   * y endpoints CRUD.
   */
  run(
    `npx nest g resource modules/${pluralName} ` +
      '--type rest --crud --no-spec',
  );

  /*
   * Genera un provider plano:
   * src/modules/trips/trips.repository.ts
   */
  run(
    `npx nest g provider modules/${pluralName}/${pluralName}.repository ` +
      '--flat --no-spec',
  );

  const repositoryPath = path.join(
    resourceDirectory,
    `${pluralName}.repository.ts`,
  );

  const servicePath = path.join(
    resourceDirectory,
    `${pluralName}.service.ts`,
  );

  const modulePath = path.join(
    resourceDirectory,
    `${pluralName}.module.ts`,
  );

const repositoryContent = `import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Create${singularClassName}Dto } from './dto/create-${singularName}.dto';
import { Update${singularClassName}Dto } from './dto/update-${singularName}.dto';
import { ${singularClassName} } from './entities/${singularName}.entity';

@Injectable()
export class ${pluralClassName}Repository {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  async create(
    create${singularClassName}Dto: Create${singularClassName}Dto,
  ): Promise<${singularClassName}> {
    const query = \`
      INSERT INTO ${pluralName} (
        /* TODO: columnas */
      )
      VALUES (
        /* TODO: $1, $2, $3... */
      )
      RETURNING *
    \`;

    const values = [
      /* TODO: valores de create${singularClassName}Dto */
    ];

    const result =
      await this.databaseService.query<${singularClassName}>(
        query,
        values,
      );

    return result.rows[0];
  }

  async findAll(): Promise<${singularClassName}[]> {
    const result =
      await this.databaseService.query<${singularClassName}>(\`
        SELECT *
        FROM ${pluralName}
      \`);

    return result.rows;
  }

  async findById(
    id: number,
  ): Promise<${singularClassName} | null> {
    const result =
      await this.databaseService.query<${singularClassName}>(
        \`
          SELECT *
          FROM ${pluralName}
          WHERE id = $1
        \`,
        [id],
      );

    return result.rows[0] ?? null;
  }

  async update(
    id: number,
    update${singularClassName}Dto: Update${singularClassName}Dto,
  ): Promise<${singularClassName} | null> {
    const query = \`
      UPDATE ${pluralName}
      SET
        /* TODO: columna = $1 */
      WHERE id = $2
      RETURNING *
    \`;

    const values = [
      /* TODO: valores de update${singularClassName}Dto */
      id,
    ];

    const result =
      await this.databaseService.query<${singularClassName}>(
        query,
        values,
      );

    return result.rows[0] ?? null;
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.databaseService.query(
      \`
        DELETE FROM ${pluralName}
        WHERE id = $1
      \`,
      [id],
    );

    return result.rowCount === 1;
  }
}
`;

  const serviceContent = `import { Injectable } from '@nestjs/common';
import { Create${singularClassName}Dto } from './dto/create-${singularName}.dto';
import { Update${singularClassName}Dto } from './dto/update-${singularName}.dto';
import { ${pluralClassName}Repository } from './${pluralName}.repository';

@Injectable()
export class ${pluralClassName}Service {
  constructor(
    private readonly ${pluralName}Repository: ${pluralClassName}Repository,
  ) {}

  create(create${singularClassName}Dto: Create${singularClassName}Dto) {
    return this.${pluralName}Repository.create(
      create${singularClassName}Dto,
    );
  }

  findAll() {
    return this.${pluralName}Repository.findAll();
  }

  findOne(id: number) {
    return this.${pluralName}Repository.findById(id);
  }

  update(
    id: number,
    update${singularClassName}Dto: Update${singularClassName}Dto,
  ) {
    return this.${pluralName}Repository.update(
      id,
      update${singularClassName}Dto,
    );
  }

  remove(id: number) {
    return this.${pluralName}Repository.remove(id);
  }
}
`;

  const moduleContent = `import { Module } from '@nestjs/common';
import { ${pluralClassName}Service } from './${pluralName}.service';
import { ${pluralClassName}Controller } from './${pluralName}.controller';
import { ${pluralClassName}Repository } from './${pluralName}.repository';

@Module({
  controllers: [${pluralClassName}Controller],
  providers: [
    ${pluralClassName}Service,
    ${pluralClassName}Repository,
  ],
})
export class ${pluralClassName}Module {}
`;

  writeFile(repositoryPath, repositoryContent);
  writeFile(servicePath, serviceContent);
  writeFile(modulePath, moduleContent);

  run('npx prettier --write "src/modules/**/*.ts"');

  console.log(
    `\nRecurso "${pluralName}" generado correctamente.`,
  );
} catch (error) {
  console.error('\nNo se pudo generar el recurso.');

  if (error instanceof Error) {
    console.error(error.message);
  }

  process.exit(1);
}