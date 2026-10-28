import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entity/usuario.entity';
import { EmpleadosModule } from '../empleados/empleados.module';
import { UsuariosService } from './service/usuarios.service';
import { USUARIOS_REPOSITORY } from './repository/usuarios.repository.interface';
import { UsuariosRepository } from './repository/usuarios.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario]), EmpleadosModule],

  providers: [
    UsuariosService,
    { provide: USUARIOS_REPOSITORY, useClass: UsuariosRepository },
  ],
  exports: [UsuariosService],
})
export class UsuariosModule {}
