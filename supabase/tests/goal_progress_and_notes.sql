begin;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where employee_number='EM00147'),true);
set local role authenticated;
do $$
declare p uuid; saved public.development_plans; a uuid; progress_value int;
begin
 select id into p from public.development_plans where title='QA TEST 07 Sep 2026 — PIP submission verification';
 if p is null then raise exception 'Test plan missing'; end if;
 begin
  perform public.respond_to_plan_agreement(p,'changes_requested','  ');
  raise exception 'Blank explanation accepted';
 exception when raise_exception then
  if sqlerrm <> 'Explain the changes you are requesting' then raise; end if;
 end;
 select * into saved from public.respond_to_plan_agreement(p,'changes_requested','QA rollback test: clarify action scope');
 if saved.employee_agreement_note <> 'QA rollback test: clarify action scope' then raise exception 'Note not saved'; end if;
 select id into p from public.development_plans where title='QA TEST 07 Sep 2026 — PDP submission verification';
 select id into a from public.development_plan_actions where plan_id=p limit 1;
 update public.development_plan_actions set status='completed', completed_at=now() where id=a;
 select progress into progress_value from public.development_plans where id=p;
 if progress_value <> 100 then raise exception 'Plan progress did not reach 100: %',progress_value; end if;
 update public.goals set progress=35,status='in_progress' where title='QA TEST 07 Sep 2026 — weekly goal submission verification';
 select progress into progress_value from public.goals where title='QA TEST 07 Sep 2026 — weekly goal submission verification';
 if progress_value <> 35 then raise exception 'Own goal progress did not save'; end if;
end $$;
rollback;
