-- 3.1 Invoice cannot be reused (cash discipline) --
create unique index unique_cash_invoice
on public.transactions (invoice_document_id)
where invoice_document_id is not null;

-- 3.2 Performance indexes (future-safe) --
create index idx_transactions_workbench
on public.transactions (workbench_id);

create index idx_transactions_party
on public.transactions (party_id);

create index idx_transactions_date
on public.transactions (transaction_date);
