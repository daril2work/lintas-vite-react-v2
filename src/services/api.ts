import { staffService } from './staff.service';
import { inventoryService, MASTER_DATA as INVENTORY_MASTER } from './inventory.service';
import { machineService, MACHINE_DATA } from './machine.service';
import { commonService } from './common.service';

export const MASTER_DATA = {
    ...INVENTORY_MASTER,
    ...MACHINE_DATA
};

export const api = {
    ...staffService,
    ...inventoryService,
    ...machineService,
    ...commonService,

    // Helper methods to maintain full compatibility
    getDepartments: async (): Promise<string[]> => MASTER_DATA.DEPARTMENTS,
    getCategories: async (): Promise<string[]> => MASTER_DATA.CATEGORIES,
};
