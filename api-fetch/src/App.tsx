import React, { useState, useEffect } from "react";
import "./App.css";

interface ButtonProps {
    type: string,
    value: string,
    onClick: React.MouseEventHandler<HTMLInputElement>
}

function Button({ type, value, onClick }: ButtonProps) {
    return (<input type={type} value={value} onClick={onClick} />);
}

interface SystemKills {
    system_id: number,
    npc_kills: number,
    pod_kills: number,
    ship_kills: number
}

interface TableProps {
    timestamp: string,
    expiryDate: string,
    allSystemKills: SystemKills[],
}

function Table({ timestamp, expiryDate, allSystemKills }: TableProps) {
    return (
        <>
            <table>
                <caption>{"Table timestamp: " + timestamp}<br />{"Expiry Date: " + expiryDate}</caption>
                <tbody>
                    <tr>
                        <th>system_id</th>
                        <th>npc_kills</th>
                        <th>pod_kills</th>
                        <th>ship_kills</th>
                    </tr>
                    <TableDataColumns className={"table-cell"} allSystemKills={allSystemKills} />
                </tbody>
            </table>
        </>
    );
}

interface TableDataColumnsProps {
    allSystemKills: SystemKills[],
    className: string
}

function TableDataColumns({ allSystemKills, className }: TableDataColumnsProps) {
    const rows = allSystemKills.map((systemKill) => <TableRow className={className} key={systemKill.system_id} system_id={systemKill.system_id} npc_kills={systemKill.npc_kills} pod_kills={systemKill.pod_kills} ship_kills={systemKill.ship_kills} />);
    return (<>{rows}</>);
}

interface TableRowProps extends SystemKills {
    className: string
}

function TableRow({ system_id, pod_kills, npc_kills, ship_kills, className }: TableRowProps) {
    return (
        <tr key={system_id}>
            <TableColumnItem className={className} key={"system_id_" + system_id} value={system_id} />
            <TableColumnItem className={className} key={"npc_kills_" + system_id} value={npc_kills} />
            <TableColumnItem className={className} key={"pod_kills_" + system_id} value={pod_kills} />
            <TableColumnItem className={className} key={"ship_kills_" + system_id} value={ship_kills} />
        </tr>);
}

interface TableColumnItemProps {
    className: string,
    value: number
}

function TableColumnItem({ className, value }: TableColumnItemProps) {
    return <td className={className}>{value}</td>;
}

const useEsiApi = () => {
    const [fetchedTimestamp, setFetchedTimestamp] = useState<string>("Never");
    const [expiryDate, setExpiryDate] = useState<string>("Never");
    const [systems, setSystems] = useState([0]);
    const [systemKills, setSystemKills] = useState([{ "system_id": 0, "npc_kills": 0, "pod_kills": 0, "ship_kills": 0 }]);
    const [allSystemKills, setAllSystemKills] = useState([{ "system_id": 0, "npc_kills": 0, "pod_kills": 0, "ship_kills": 0 }]);

    useEffect(() => {
        const fetchSystems = async () => {
            const response = await fetch("https://esi.evetech.net/latest/universe/systems/?datasource=tranquility");
            const json = await response.json();
            setSystems(json);
        };
        fetchSystems();
    }, []);
    useEffect(() => {
        const fetchSystemKills = async () => {
            const response = await fetch("https://esi.evetech.net/latest/universe/system_kills/?datasource=tranquility");
            const json = await response.json();
            setSystemKills(json);
            const date = response.headers.get("expires");
            if (date == null) {
                setExpiryDate("Never");
            } else {
                setExpiryDate(date);
            }

        };
        fetchSystemKills();
    }, [fetchedTimestamp]);
    useEffect(() => {
        const mapSystemKills = new Map();
        for (const systemKill of systemKills) {
            mapSystemKills.set(systemKill["system_id"], systemKill);
        }
        const allSystemKills = [];
        for (const system of systems) {
            if (mapSystemKills.has(system)) {
                allSystemKills.push({ "system_id": system, "npc_kills": mapSystemKills.get(system).npc_kills, "pod_kills": mapSystemKills.get(system).pod_kills, "ship_kills": mapSystemKills.get(system).ship_kills });
            } else {
                allSystemKills.push({ "system_id": system, "npc_kills": 0, "pod_kills": 0, "ship_kills": 0 });
            }
        }
        setAllSystemKills(allSystemKills);
    }, [fetchedTimestamp]);

    return { expiryDate, fetchedTimestamp, allSystemKills, setFetchedTimestamp };
};

function App() {
    const { expiryDate, fetchedTimestamp, allSystemKills, setFetchedTimestamp } = useEsiApi();

    return (
        <>
            <Button type="button" value="Refresh data" onClick={() => setFetchedTimestamp(new Date().toString())} />
            <Table timestamp={fetchedTimestamp} expiryDate={expiryDate} allSystemKills={allSystemKills} />
        </>
    );
}

export default App;
