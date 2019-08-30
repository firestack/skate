defmodule Gtfs.Supervisor do
  use Supervisor

  def start_link([]) do
    Supervisor.start_link(__MODULE__, :ok)
  end

  @impl true
  def init(:ok) do
    children = [
      {Gtfs, [Application.get_env(:skate, :gtfs_url)]},
      {Gtfs.HealthServer, []}
    ]

    Supervisor.init(children, strategy: :one_for_all)
  end
end
