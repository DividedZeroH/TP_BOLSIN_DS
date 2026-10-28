import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Empleado } from '../entity/empleado.entity';
import { ComisionMedica } from '../../comisiones-medicas/entity/comision-medica.entity';
import { ComisionesMedicasService } from '../../comisiones-medicas/service/comisiones-medicas.service';
import {
  EMPLEADOS_REPOSITORY,
  EmpleadosRepositoryInterface,
} from '../repository/empleados.repository.interface';

@Injectable()
export class EmpleadosService {
  constructor(
    @Inject(EMPLEADOS_REPOSITORY)
    private readonly repository: EmpleadosRepositoryInterface,
    private readonly comisionesMedicasService: ComisionesMedicasService,
  ) {}
  async buscarEmpleado(id: number): Promise<Empleado> {
    const empleado = await this.repository.buscarPorId(id);
    if (!empleado) throw new NotFoundException('No se encontró el empleado indicado.');
    empleado.comisionMedica = await this.comisionesMedicasService.buscarComisionMedica(
      empleado.comisionMedicaId,
    );
    return empleado;
  }
  getComisionMedica(empleado: Empleado): ComisionMedica {
    return empleado.comisionMedica;
  }
}
