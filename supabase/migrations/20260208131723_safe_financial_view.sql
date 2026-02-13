create view public.v_transactions_net as
select
  t.id,
  t.workbench_id,
  t.transaction_date,
  t.amount,
  t.direction,
  coalesce(a.adjustment_amount, 0) as adjustment,
  (t.amount + coalesce(a.adjustment_amount, 0)) as net_amount
from public.transactions t
left join public.adjustments a
  on a.original_transaction_id = t.id;

