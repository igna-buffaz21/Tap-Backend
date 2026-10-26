import { DatabaseService } from '../../../database/database.service';
import { StockMovementsRepository } from '../stock-movements.repository';

describe('StockMovementsRepository sale stock validation', () => {
  const database = { query: jest.fn() };
  const repository = new StockMovementsRepository(
    database as unknown as DatabaseService,
  );

  it('adds repeated sale items before checking locked stock', async () => {
    const transaction = {
      query: jest.fn().mockResolvedValue({
        rows: [{ id: 1, quantity: '3.000' }],
      }),
    };

    const result = await repository.validateSaleStockAvailabilityInTransaction(
      transaction,
      1,
      2,
      [
        { product_id: 9, quantity: 2 },
        { product_id: 9, quantity: 2 },
      ],
    );

    expect(result).toEqual({
      available: false,
      productId: 9,
      availableQuantity: 3,
      requestedQuantity: 4,
    });
    expect(transaction.query).toHaveBeenCalledWith(
      expect.stringContaining('FOR UPDATE'),
      [1, 2, 9],
    );
  });
});
